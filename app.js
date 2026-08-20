let currentView = "timeline"; // "timeline", "graph" or "doc"

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
   } else if (currentView === "graph") {
      resetGraph();
   }
}

function switchView(view) {
   currentView = view;

   document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
   });

   ["timeline", "graph", "doc"].forEach((name) => {
      if (name === view) return;
      const div = document.getElementById(name);
      div.style.display = "none";
      div.style.opacity = "0";
   });

   const activeDiv = document.getElementById(view);
   activeDiv.style.display = "block";

   if (view === "timeline") {
      if (!timelineChart) {
         setupTimeline();
      } else {
         refreshTimeline();
      }
   } else if (view === "graph") {
      if (!chart) {
         setupGraph();
      } else {
         setupGraphWithFilter();
      }
      if (currentSelectedCourse) {
         highlightNode(currentSelectedCourse);
      }
   } else {
      renderDoc();
   }

   setTimeout(() => { activeDiv.style.opacity = "1"; }, 50);
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
   } else if (currentView === "graph") {
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
   setupDoc();
   setupViewToggle();
   setupSpecFilter();
   setupSearchBoth();

   await loadCustomGraph();

   switchView("timeline");
}

window.addEventListener("DOMContentLoaded", init);
