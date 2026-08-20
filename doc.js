let showCourseCodes = false;

function courseLabel(course) {
   return showCourseCodes ? `${course.code} - ${course.name}` : course.name;
}

function getDocPrereqs(courseCode, links) {
   return links
      .filter((link) => link.target === courseCode)
      .map((link) => curriculum.courses.find((c) => c.code === link.source))
      .filter(Boolean);
}

function docLine(className, course) {
   const row = document.createElement("div");
   row.className = className;
   row.textContent = courseLabel(course);
   return row;
}

function renderDoc() {
   const container = document.getElementById("doc");
   const courses = getFilteredCourses();
   const links = getFilteredLinks();

   const page = document.createElement("div");
   page.className = "doc-page";

   const years = [...new Set(courses.map((c) => c.year))].sort((a, b) => a - b);

   years.forEach((year) => {
      const column = document.createElement("div");
      column.className = "doc-column";

      const heading = document.createElement("div");
      heading.className = "doc-year";
      heading.textContent = `Year ${year}`;
      column.appendChild(heading);

      courses
         .filter((c) => c.year === year)
         .forEach((course) => {
            column.appendChild(docLine("doc-course", course));
            getDocPrereqs(course.code, links).forEach((prereq) => {
               column.appendChild(docLine("doc-prereq", prereq));
            });
         });

      page.appendChild(column);
   });

   container.replaceChildren(page);
   syncDocOffset();
}

function refreshDoc() {
   if (currentView === "doc") renderDoc();
}

function syncDocOffset() {
   const controls = document.getElementById("controls");
   const container = document.getElementById("doc");
   if (!controls || !container) return;

   container.style.paddingTop = `${controls.getBoundingClientRect().height + 24}px`;
}

function setupCodeToggle() {
   const checkbox = document.getElementById("showCodes");

   showCourseCodes = checkbox.checked;

   checkbox.addEventListener("change", () => {
      showCourseCodes = checkbox.checked;
      refreshDoc();
   });
}

function setupDoc() {
   new ResizeObserver(syncDocOffset).observe(document.getElementById("controls"));
   setupCodeToggle();
}
