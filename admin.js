let isAdminMode = false;
let currentSelectedCourse = null;

function syncAdminUI() {
   const content = document.getElementById("adminContent");
   const placeholder = document.getElementById("adminPlaceholder");

   if (!currentSelectedCourse) {
      content?.classList.add("hidden");
      placeholder?.classList.remove("hidden");
   } else {
      content?.classList.remove("hidden");
      placeholder?.classList.add("hidden");
   }
}

function selectCourseForAdmin(courseCode) {
   const course = curriculum.courses.find((c) => c.code === courseCode);
   if (course) {
      currentSelectedCourse = courseCode;

      const selectedCourseText = document.getElementById("selectedCourseText");
      const selectedCourse = document.getElementById("selectedCourse");
      selectedCourseText.textContent = `${course.code} - ${course.name}`;
      selectedCourse.style.display = "block";

      const adminTitle = document.getElementById("adminPanelTitle");
      if (adminTitle) {
         adminTitle.textContent = `Add prerequisite for ${course.name} (${course.code})`;
      }

      syncAdminUI();
      updatePrereqList();
   }
}

function setupAdminMode() {
   const adminToggle = document.getElementById("adminToggle");
   const adminPanel = document.getElementById("adminPanel");
   const addPrereqSearch = document.getElementById("addPrereqSearch");
   const addPrereqResults = document.getElementById("addPrereqResults");

   adminToggle.addEventListener("click", () => {
      isAdminMode = !isAdminMode;
      adminPanel.style.display = isAdminMode ? "block" : "none";
      adminToggle.textContent = isAdminMode
         ? "Exit Admin Mode"
         : "Enter Admin Mode";
      adminToggle.style.background = isAdminMode ? "#ef4444" : "";

      if (isAdminMode) {
         syncAdminUI();
      }
   });

   addPrereqSearch.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      if (searchTerm === "" || !currentSelectedCourse) {
         addPrereqResults.style.display = "none";
         return;
      }

      const matches = curriculum.courses.filter(
         (c) =>
            (c.code.toLowerCase().includes(searchTerm) ||
               c.name.toLowerCase().includes(searchTerm)) &&
            c.code !== currentSelectedCourse,
      );

      if (matches.length > 0) {
         addPrereqResults.innerHTML = matches
            .map(
               (course) => `
            <div class="add-prereq-item" data-code="${course.code}" style="padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;">
               <strong>${course.code}</strong> - ${course.name}
            </div>
         `,
            )
            .join("");
         addPrereqResults.style.display = "block";
      } else {
         addPrereqResults.innerHTML =
            '<div style="padding: 8px; color: #999;">No matches found</div>';
         addPrereqResults.style.display = "block";
      }
   });

   addPrereqResults.addEventListener("click", async (e) => {
      const item = e.target.closest(".add-prereq-item");
      if (item && currentSelectedCourse) {
         const prereqCode = item.dataset.code;
         const targetCode = currentSelectedCourse;

         await loadCustomGraph();

         if (wouldCreateCycle(prereqCode, targetCode)) {
            alert("This would create a circular dependency! Cannot add this prerequisite.");
            return;
         }

         const currentLinks = getMergedGraph();
         if (currentLinks.find(link => link.source === prereqCode && link.target === targetCode)) {
            alert("This prerequisite already exists on the server!");
            return;
         }

         customGraph.push({
            action: "add",
            source: prereqCode,
            target: targetCode,
         });

         await saveCustomGraph();
         refreshGraph();
         highlightNode(targetCode);
         updatePrereqList();
         
         addPrereqSearch.value = "";
         addPrereqResults.style.display = "none";
      }
   });
}

function wouldCreateCycle(newSource, newTarget) {
   const visited = new Set();
   const currentLinks = getMergedGraph();

   function dfs(node) {
      if (node === newSource) return true;
      if (visited.has(node)) return false;
      visited.add(node);

      const dependencies = currentLinks.filter((link) => link.source === node);
      for (const dep of dependencies) {
         if (dfs(dep.target)) return true;
      }
      return false;
   }

   return dfs(newTarget);
}

function updatePrereqList() {
   const prereqList = document.getElementById("prereqList");

   if (!currentSelectedCourse) {
      prereqList.innerHTML =
         '<em style="color: #999;">Search and click a course to view prerequisites</em>';
      return;
   }

   const currentLinks = getMergedGraph();
   const prereqs = currentLinks.filter(
      (link) => link.target === currentSelectedCourse,
   );

   if (prereqs.length === 0) {
      prereqList.innerHTML = '<em style="color: #999;">No prerequisites</em>';
   } else {
      prereqList.innerHTML = prereqs
         .map((link) => {
            const course = curriculum.courses.find(
               (c) => c.code === link.source,
            );
            return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; margin: 5px 0; background: #f9f9f9; border-radius: 3px;">
               <span>${link.source} - ${course ? course.name : ""}</span>
               <button onclick="removePrereq('${link.source}', '${currentSelectedCourse}')" style="padding: 3px 8px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">Remove Prerequisite</button>
            </div>
         `;
         })
         .join("");
   }
}

window.removePrereq = async function (source, target) {
   await loadCustomGraph();

   const isDefault = graph.find(
      (link) => link.source === source && link.target === target,
   );

   if (isDefault) {
      if (!customGraph.find(c => c.action === "remove" && c.source === source && c.target === target)) {
         customGraph.push({ action: "remove", source, target });
      }
   } else {
      const idx = customGraph.findIndex(
         (c) => c.action === "add" && c.source === source && c.target === target,
      );
      if (idx >= 0) customGraph.splice(idx, 1);
   }

   await saveCustomGraph();
   refreshGraph();
   updatePrereqList();
};