const apiKey = "AIzaSyDB7kb4a_Lc2nCDaVGmL9FAGEgk8PQmtWQ";
let currentVideos = [];
let currentUser = null;

const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-btn");
const results = document.getElementById("results");
const playerSection = document.getElementById("player");
const suggestionsBox = document.getElementById("suggestions");

// 🔐 FIREBASE AUTHENTICATION
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log("✅ User authenticated:", user.uid);
  } else {
    // Sign in anonymously if no user
    firebase.auth().signInAnonymously()
      .then(() => {
        console.log("✅ Signed in anonymously");
      })
      .catch((error) => {
        console.error("❌ Auth error:", error);
      });
  }
});

// 🔍 SEARCH FUNCTION
async function searchYouTube() {
  const query = searchInput.value.trim();
  if (!query) return;

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
    query
  )}&key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      alert("Error: " + data.error.message);
      return;
    }

    showResults(data.items);
    suggestionsBox.classList.add("hidden"); // Hide suggestions
  } catch (err) {
    alert("Failed to fetch videos.");
    console.error(err);
  }
}

// 🎥 SHOW VIDEO RESULTS
function showResults(videos) {
  const placeholderBox = document.getElementById("placeholderBox");
  const results = document.getElementById("results");
  const playerSection = document.querySelector("#player");
  const suggestionsBox = document.getElementById("suggestions");

  results.innerHTML = "";
  playerSection.innerHTML = "";
  playerSection.classList.add("hidden");
  suggestionsBox.classList.add("hidden");

  if (videos.length > 0) {
    placeholderBox.classList.add("hidden");
  } else {
    placeholderBox.classList.remove("hidden");
  }

  videos.forEach((video) => {
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const thumbnail = video.snippet.thumbnails.default.url;

    const div = document.createElement("div");
    div.className = "video-item";
    div.innerHTML = `
        <img src="${thumbnail}" alt="${title}" />
        <div class="video-details">
          <p class="video-title">${title}</p>
        </div>
      `;

    div.addEventListener("click", () => playVideo(videoId, video.snippet));
    results.appendChild(div);
  });
}

// ▶️ PLAY VIDEO AND SAVE TO FIREBASE
function playVideo(videoId, snippet) {
  playerSection.innerHTML = `
    <div class="aspect-video w-full mb-4">
      <iframe
        class="w-full h-full rounded-lg"
        src="https://www.youtube.com/embed/${videoId}?autoplay=1"
        title="${snippet.title}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>
    <h2 class="text-lg font-bold mb-1">${snippet.title}</h2>
    <p class="text-sm text-gray-400 mb-4">${snippet.channelTitle}</p>
    <p class="text-sm">${snippet.description || "No description available."}</p>
  `;
  playerSection.classList.remove("hidden");
  window.scrollTo({ top: playerSection.offsetTop - 60, behavior: "smooth" });

  // Save video to Firebase (USER-SPECIFIC PATH)
  if (currentUser) {
    const dbRef = firebase.database().ref(`users/${currentUser.uid}/playedVideos`);
    dbRef
      .push({
        videoId,
        title: snippet.title,
        channel: snippet.channelTitle,
        thumbnail: snippet.thumbnails.default.url,
        playedAt: new Date().toISOString(),
      })
      .then(() => console.log("✅ Video saved to Firebase!"))
      .catch((error) => console.error("❌ Firebase Save Error:", error));
  } else {
    console.warn("⚠️ User not authenticated, cannot save video");
  }
}

// 🧠 SUGGESTION SYSTEM (Google Suggest API)
let activeScript = null;
let lastCallbackName = null;

function fetchSuggestions(query) {
  if (activeScript) {
    document.head.removeChild(activeScript);
    activeScript = null;
  }
  if (lastCallbackName) {
    delete window[lastCallbackName];
    lastCallbackName = null;
  }

  const callbackName = "jsonp_callback_" + Math.round(100000 * Math.random());
  lastCallbackName = callbackName;

  window[callbackName] = function (data) {
    if (!searchInput.value.trim()) return;

    suggestionsBox.innerHTML = "";
    data[1].forEach((suggestion) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = suggestion;
      item.addEventListener("click", () => {
        searchInput.value = suggestion;
        suggestionsBox.classList.add("hidden");
        searchYouTube();
      });
      suggestionsBox.appendChild(item);
    });

    suggestionsBox.classList.remove("hidden");
    document.head.removeChild(activeScript);
    delete window[callbackName];
    activeScript = null;
    lastCallbackName = null;
  };

  const script = document.createElement("script");
  script.src = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
    query
  )}&callback=${callbackName}`;
  document.head.appendChild(script);
  activeScript = script;
}

// 🔁 Event Listeners
searchInput.addEventListener("input", () => {
  const value = searchInput.value.trim();
  if (value.length > 0) {
    fetchSuggestions(value);
  } else {
    suggestionsBox.innerHTML = "";
    suggestionsBox.classList.add("hidden");
  }
});

searchInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    suggestionsBox.classList.add("hidden");
    searchYouTube();
  }
});

searchButton.addEventListener("click", () => {
  suggestionsBox.classList.add("hidden");
  searchYouTube();
});
