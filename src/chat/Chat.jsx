import { useEffect, useState, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatPanel from "../components/ChatPanel";
import ListDetailsPanel from "../components/ListDetailsPanel";
import { todoPlaintext, todoJSON } from "./navigator";
import { isInjectionLike, extractValidatedTodo } from "./chat_helpers";
import SpeechService from "./speech";
import WeekCalendar from "../components/calendar";
import PrefModal from "../components/PrefModal";

  //
  //  Hero text options
  //
  const HERO_GREETINGS = [
    "What's on the schedule this week?",
    "What are we tackling today?",
    "What needs to get done?",
    "What's the game plan?",
    "What's on your plate?",
    "What are we working with?",
    "Hit me with the tasks.",
    "Alright, what's the damage?",
    "Let's get organized.",
    "What chaos are we taming today?",
    "Ready when you are.",
    "What's the move?",
    "Pour it out, I'll sort it.",
    "Give me the rundown.",
    "What's weighing on you?",
  ];

  const HERO_LOADING_START = [
    "Processing your word vomit...",
    "Decoding your stream of consciousness...",
    "Turning your rambling into a plan...",
    "One sec, translating human to todo...",
    "Reading between the lines...",
    "Extracting the tasks from the chaos...",
    "Parsing your brain dump...",
    "Sifting through the madness...",
    "Making sense of all that...",
    "Let me work my magic...",
    "Alright, give me a second...",
    "Crunching your thoughts...",
    "Thinking about it really hard..."
  ];

  const HERO_LOADING_ALMOST = [
    "Dang bro this week sucks...",
    "Almost there, hang tight...",
    "Okay wow you're busy...",
    "Putting the finishing touches on...",
    "You sure about all this?",
    "This is... a lot. Respect.",
    "Wrapping it up, one sec...",
    "Do you even sleep?",
    "Just dotting the i's...",
    "I'm tired just reading this...",
    "Polishing your master plan...",
    "Good news: it's almost done. Bad news: you gotta do all this.",
    "ur cooked dawg 🥀 "
  ];

  const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];


export default function Chat() {
  const [mainView, setMainView] = useState("chat"); // "chat" or "listDetail"
  const [activeListName, setActiveListName] = useState(null);
  const [chatMode, setChatMode] = useState("query");  // "query" or "result"
  const [heroText, setHeroText] = useState(() => randomFrom(HERO_GREETINGS));
  const [query, setQuery] = useState("");
  const [responseList, setResponseList] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [pastQueries, setPastQueries] = useState([]);
  const [availableLists, setAvailableLists] = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [contextToggle, setContextToggle] = useState(false);
  const speechRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [responseListName, setResponseListName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  //////////////////////////////////////////////////////////////////
  // Check browswer or OS dark mode prefrence and default to that //
  //////////////////////////////////////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["darkMode"], (result) => {
      let isDarkMode;
      if (result.darkMode !== undefined) {
        isDarkMode = result.darkMode;
      }

      else {
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDarkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    });
  }, []);


  ///////////////////////////////////////////
  // Pull previously sent queries on mount //
  ///////////////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["pastFiveQueries"], (result) => {
      setPastQueries(result.pastFiveQueries || []);
    });
  }, []);


  ///////////////////////////////
  // Initialize speech service //
  ///////////////////////////////
  useEffect(() => {
    speechRef.current = new SpeechService();

    speechRef.current.onTranscript((text) => {
      setLiveTranscript(text);
      setQuery(text);
    });

    return () => {
      speechRef.current?.stop();
    };
  }, []);


  ////////////////////////////////////////////
  // Load available lists from localStorage //
  ////////////////////////////////////////////
  useEffect(() => {
    chrome.storage?.local.get(["todoData"], (result) => {
      const data = result?.todoData || {};
      const listNames = Object.keys(data);
      setAvailableLists(listNames);
    });
  }, [refreshTrigger]);


  ////////////////////////////////
  // Send the user query to LLM //
  ////////////////////////////////
  const handleSend = async () => {
    if (!query.trim()) return;
    setIsLoading(true);

    const isListSelected = selectedList !== "";

    let ctx_list;

    if (isListSelected) {
      const { todoData } = await chrome.storage.local.get("todoData");
      ctx_list = todoData?.[selectedList];
    }

    if (isInjectionLike(query)) {
      setHeroText("Nice try.");
      return;
    }

    const updatedQueries = [query, ...pastQueries].slice(0, 5);
    setPastQueries(updatedQueries);
    chrome.storage?.local.set({ pastFiveQueries: updatedQueries });

    setHeroText(randomFrom(HERO_LOADING_START));

    const responsePlaintext = await todoPlaintext(query, ctx_list, contextToggle);
    const outputPlaintext = responsePlaintext.choices[0].message.content;

    setHeroText(randomFrom(HERO_LOADING_ALMOST));

    let parsed;

    for (let attempt = 0; attempt < 3; attempt++) {
      const responseJSON = await todoJSON(outputPlaintext);
      const validated = extractValidatedTodo(responseJSON);
      if (validated) {
        parsed = validated;
        break;
      }
    }

    if (!parsed) {
      setHeroText("Something broke. Wanna try that again?");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setResponseList(parsed.todo);
    setResponseListName(parsed.name || "");
    setChatMode("result");
    setHeroText(randomFrom(HERO_GREETINGS));
    setQuery("");
  };


  ////////////////////////
  // Handle voice input //
  ////////////////////////
  const handleMic = () => {
    if (!speechRef.current) return;

    if (isListening) {
      speechRef.current.stop();
      setIsListening(false);

      const finalTranscript = speechRef.current.getTranscript().trim();
      if (finalTranscript) setQuery(finalTranscript);
    }
    
    else {
      speechRef.current.resetTranscript();
      setLiveTranscript("");
      speechRef.current.start();
      setIsListening(true);
    }
  };


  /////////////////////////////////////
  // Key detection for submit hotkey //
  /////////////////////////////////////
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  /////////////////////////////////////////
  // Handler for response action buttons //
  /////////////////////////////////////////
  const handleReplace = (name) => {
    if (!responseList) return;

    const targetList = name || selectedList || "Your New List";

    chrome.storage?.local.get(["todoData", "todoTimestamps"], (result) => {
      const todoData = result?.todoData || {};
      todoData[targetList] = responseList;

        const timestamps = result?.todoTimestamps || {};
        timestamps[targetList] = Date.now();
        chrome.storage?.local.set({ todoData, todoTimestamps: timestamps }, () => {
        setRefreshTrigger(prev => prev + 1);
        setResponseList(null);
        setChatMode("query");
        setActiveListName(targetList);
        setMainView("listDetail");
      });
    });
  };

  const handleDiscard = () => {
    setResponseList(null);
    setChatMode("query");
    setSelectedList("");
  };


  //////////////////////////////////////////
  // Sidebar callbacks for view switching //
  //////////////////////////////////////////
  const handleSelectList = (listName) => {
    setActiveListName(listName);
    setMainView("listDetail");
  };

  const handleSelectNewList = () => {
    setActiveListName(null);
    setMainView("chat");
    setSelectedList("");
  };

  const showQueryWithContext = (listName) => {
    setActiveListName(null);
    setMainView("chat");
    setSelectedList(listName);
  };

  ////////////
  // Render //
  ////////////
  return (
    <div className="flex h-screen w-screen flex-col">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <div className="w-72 p-4 border-r border-light-border dark:border-dark-border bg-light-bg-sidebar dark:bg-dark-bg-sidebar">
          <Sidebar key={refreshTrigger} onSelectList={handleSelectList} onSelectNewList={handleSelectNewList} onOpenPreferences={() => setShowPrefModal(true)} onOpenCalendar={() => setShowCalendar(true)} />
        </div>

        {/* Right Side - Switches between Chat and List Detail */}
        {mainView === "chat" ? (
          <ChatPanel
            chatMode={chatMode}
            setChatMode={setChatMode}
            heroText={heroText}
            setHeroText={setHeroText}
            query={query}
            setQuery={setQuery}
            lastQuery={pastQueries[0]}
            responseList={responseList}
            setResponseList={setResponseList}
            availableLists={availableLists}
            selectedList={selectedList}
            setSelectedList={setSelectedList}
            contextToggle={contextToggle}
            setContextToggle={setContextToggle}
            isListening={isListening}
            handleMic={handleMic}
            handleSend={handleSend}
            handleKeyDown={handleKeyDown}
            handleReplace={handleReplace}
            handleDiscard={handleDiscard}
            responseListName={responseListName}
            isLoading={isLoading}
          />
        ) : (
          <ListDetailsPanel
            listName={activeListName}
            showQueryWithContext={showQueryWithContext}
            onListUpdated={() => setRefreshTrigger(prev => prev + 1)}
          />
        )}
      </div>
      {showPrefModal && (
        <PrefModal onClose={() => setShowPrefModal(false)} />
      )}
       {showCalendar && (
        <WeekCalendar onClose={() => setShowCalendar(false)} />
      )}
    </div>
  );
}