let currentView = "timeline"; // "timeline" or "graph"

function isAdminAuthorized() {
   const params = new URLSearchParams(window.location.search);
   return params.get("admin") === "karelia2026";
}

function deselectCourse() {
   currentSelectedCourse = null;
   const searchInput = document.getElementById("search");
   if (searchInput) searchInput.value = "";

   syncAdminUI();

   if (currentView === "timeline") {
      renderTimeline();
   } else {
      resetGraph();
   }
}

function switchView(view) {
   currentView = view;
   const timelineDiv = document.getElementById("timeline");
   const graphDiv = document.getElementById("graph");

   document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
   });

   if (view === "timeline") {
      graphDiv.style.display = "none";
      graphDiv.style.opacity = "0";
      timelineDiv.style.display = "block";
      if (!timelineChart) {
         setupTimeline();
      } else {
         refreshTimeline();
      }
      setTimeout(() => { timelineDiv.style.opacity = "1"; }, 50);
   } else {
      timelineDiv.style.display = "none";
      timelineDiv.style.opacity = "0";
      graphDiv.style.display = "block";
      if (!chart) {
         setupGraph();
      } else {
         setupGraphWithFilter();
      }
      if (currentSelectedCourse) {
         highlightNode(currentSelectedCourse);
      }
      setTimeout(() => { graphDiv.style.opacity = "1"; }, 50);
   }
}

function setupViewToggle() {
   document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
         switchView(btn.dataset.view);
      });
   });
}

function setupSpecFilter() {
   document.querySelectorAll(".spec-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
         setSpecFilter(btn.dataset.filter);
      });
   });
}

function selectCourse(courseCode) {
   if (currentView === "timeline") {
      highlightTimelineNode(courseCode);
   } else {
      highlightNode(courseCode);
   }
   selectCourseForAdmin(courseCode);
}

function setupSearchBoth() {
   const searchInput = document.getElementById("search");
   const searchResults = document.getElementById("searchResults");

   searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      if (searchTerm === "") {
         searchResults.style.display = "none";
         deselectCourse();
         return;
      }

      const matches = curriculum.courses.filter(
         (c) =>
            c.code.toLowerCase().includes(searchTerm) ||
            c.name.toLowerCase().includes(searchTerm)
      );

      if (matches.length > 0) {
         searchResults.innerHTML = matches
            .map(
               (course) => `
            <div class="search-result-item" data-code="${course.code}" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;">
               <strong>${course.code}</strong> - ${course.name}
            </div>
         `
            )
            .join("");
         searchResults.style.display = "block";
      } else {
         searchResults.innerHTML =
            '<div style="padding: 8px; color: #999;">No matches found</div>';
         searchResults.style.display = "block";
      }
   });

   searchResults.addEventListener("click", (e) => {
      const item = e.target.closest(".search-result-item");
      if (item) {
         const courseCode = item.dataset.code;
         const course = curriculum.courses.find((c) => c.code === courseCode);
         if (course) {
            searchInput.value = `${course.code} - ${course.name}`;
            searchResults.style.display = "none";
            selectCourse(courseCode);
         }
      }
   });

   document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-container")) {
         searchResults.style.display = "none";
      }
   });
}

async function init() {
   if (isAdminAuthorized()) {
      isAdminMode = true;
      document.getElementById("adminPanel").style.display = "block";
      syncAdminUI();
   }

   setupAdminMode();
   setupCopyPrerequisites();
   setupViewToggle();
   setupSpecFilter();
   setupSearchBoth();

   await loadCustomGraph();

   switchView("timeline");
}

window.addEventListener("DOMContentLoaded", init);
