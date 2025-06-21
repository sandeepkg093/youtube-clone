const apiKey = "AIzaSyDB7kb4a_Lc2nCDaVGmL9FAGEgk8PQmtWQ";

document.getElementById("search-btn").addEventListener("click", searchYouTube);

async function searchYouTube() {
  const query = document.getElementById("search-input").value.trim();
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
  } catch (err) {
    alert("Failed to fetch videos.");
    console.error(err);
  }
}

function showResults(videos) {
  const results = document.getElementById("results");
  results.innerHTML = "";

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

    div.addEventListener("click", () => playVideo(videoId, title));
    results.appendChild(div);
  });
}

function playVideo(videoId, title) {
  const player = document.getElementById("player");
  player.innerHTML = `
    <iframe width="100%" height="450" 
      src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
      frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
    </iframe>
  `;

  // Push to Firebase playedVideos list
  const dbRef = firebase.database().ref("playedVideos");
  const newVideoRef = dbRef.push();
  newVideoRef.set({
    videoId: videoId,
    title: title,
    playedAt: new Date().toISOString(),
  });
}
