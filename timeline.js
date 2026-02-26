let timelineChart;
let currentSpecFilter = "both"; // "both", "se", "ia"

function getSpecColor(spec) {
   if (spec === "se") return "#3b82f6";  // blue
   if (spec === "ia") return "#f97316";  // orange
   return "#94a3b8"; // gray for common
}

function getSpecLabel(spec) {
   if (spec === "se") return "Software Engineering";
   if (spec === "ia") return "Intelligent Automation";
   return "Common";
}

function getFilteredCourses() {
   return curriculum.courses.filter((course) => {
      if (currentSpecFilter === "both") return true;
      return (
         course.specialization === "common" ||
         course.specialization === currentSpecFilter
      );
   });
}

function getFilteredLinks() {
   const filteredCodes = new Set(getFilteredCourses().map((c) => c.code));
   return getMergedGraph().filter(
      (link) => filteredCodes.has(link.source) && filteredCodes.has(link.target)
   );
}

function getLinkColor(link) {
   const sourceCourse = curriculum.courses.find((c) => c.code === link.source);
   const targetCourse = curriculum.courses.find((c) => c.code === link.target);

   // Color by the most specialized endpoint
   if (sourceCourse && sourceCourse.specialization === "se") return "#3b82f6a0";
   if (sourceCourse && sourceCourse.specialization === "ia") return "#f97316a0";
   if (targetCourse && targetCourse.specialization === "se") return "#3b82f6a0";
   if (targetCourse && targetCourse.specialization === "ia") return "#f97316a0";

   return "#94a3b860";
}

function setupTimeline() {
   const container = document.getElementById("timeline");
   timelineChart = echarts.init(container);

   renderTimeline();

   timelineChart.on("click", function (params) {
      if (params.dataType === "node") {
         const courseCode = params.data.id;

         const searchInput = document.getElementById("search");
         const searchResults = document.getElementById("searchResults");
         if (searchInput) searchInput.value = `${params.data.code} - ${params.data.name}`;
         if (searchResults) searchResults.style.display = "none";

         highlightTimelineNode(courseCode);
         selectCourseForAdmin(courseCode);
      }
   });

   timelineChart.getZr().on("click", function (e) {
      if (!e.target) {
         deselectCourse();
      }
   });

   window.addEventListener("resize", function () {
      if (timelineChart) timelineChart.resize();
   });
}

function renderTimeline() {
   const courses = getFilteredCourses();
   const links = getFilteredLinks();

   const yearGroups = { 1: [], 2: [], 3: [], 4: [] };
   courses.forEach((c) => {
      if (yearGroups[c.year]) yearGroups[c.year].push(c);
   });

   const specOrder = { common: 0, se: 1, ia: 2 };
   Object.values(yearGroups).forEach((group) => {
      group.sort((a, b) => (specOrder[a.specialization] || 0) - (specOrder[b.specialization] || 0));
   });

   const containerHeight = timelineChart.getHeight();
   const containerWidth = timelineChart.getWidth();

   const marginX = 120;
   const marginY = 40;
   const usableWidth = containerWidth - marginX * 2;
   const usableHeight = containerHeight - marginY * 2;
   const yearSpacing = usableWidth / 3; // 4 years = 3 gaps

   const nodes = [];
   const yearLabels = ["Year 1", "Year 2", "Year 3", "Year 4"];

   Object.entries(yearGroups).forEach(([year, group]) => {
      const yearIdx = parseInt(year) - 1;
      const x = marginX + yearIdx * yearSpacing;
      const ySpacing = usableHeight / (group.length + 1);

      group.forEach((course, idx) => {
         const y = marginY + (idx + 1) * ySpacing;
         const spec = course.specialization;

         nodes.push({
            id: course.code,
            name: course.name,
            code: course.code,
            credits: course.credits,
            specialization: spec,
            year: course.year,
            x: x,
            y: y,
            fixed: true,
            symbolSize: Math.max(20, Math.min(40, course.credits * 3)),
            label: {
               show: true,
               fontSize: 13,
               opacity: 1,
               position: "right",
               distance: 8,
               color: getSpecColor(spec),
               formatter: function (params) {
                  const name = params.data.name;
                  return name.length > 35 ? name.substring(0, 33) + "…" : name;
               },
               textBorderColor: "#fff",
               textBorderWidth: 2,
            },
            itemStyle: {
               color: getSpecColor(spec),
               borderColor: "#fff",
               borderWidth: 2,
               shadowBlur: 4,
               shadowColor: "rgba(0,0,0,0.15)",
            },
         });
      });
   });

   const edgeLinks = links.map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: {
         color: getLinkColor(link),
         width: 1.5,
         curveness: 0.15,
         opacity: 0.7,
      },
   }));

   const option = {
      tooltip: {
         formatter: function (params) {
            if (params.dataType === "node") {
               const spec = getSpecLabel(params.data.specialization);
               return `<strong>${params.data.code}</strong><br/>${params.data.name}<br/>${params.data.credits} credits<br/><em>${spec}</em> · Year ${params.data.year}`;
            }
            return "";
         },
      },
      graphic: yearLabels.map((label, i) => ({
         type: "text",
         left: marginX + i * yearSpacing - 20,
         top: 10,
         style: {
            text: label,
            fontSize: 14,
            fontWeight: "bold",
            fill: "#475569",
         },
      })),
      series: [
         {
            type: "graph",
            layout: "none",
            coordinateSystem: null,
            data: nodes,
            links: edgeLinks,
            roam: true,
            edgeSymbol: ["none", "arrow"],
            edgeSymbolSize: 10,
            emphasis: {
               label: { fontSize: 15, fontWeight: "bold" },
               lineStyle: { width: 3 },
            },
            lineStyle: {
               curveness: 0.15,
               width: 1.5,
            },
         },
      ],
   };

   timelineChart.setOption(option, true);
}

function highlightTimelineNode(nodeId) {
   const courses = getFilteredCourses();
   const links = getFilteredLinks();

   const visitedPrereqs = new Set();
   const prereqLinks = [];

   function findPrereqs(current, depth = 0) {
      if (visitedPrereqs.has(current)) return;
      visitedPrereqs.add(current);

      links.forEach((link) => {
         if (link.target === current) {
            prereqLinks.push({ ...link, depth });
            findPrereqs(link.source, depth + 1);
         }
      });
   }
   findPrereqs(nodeId);

   const yearGroups = { 1: [], 2: [], 3: [], 4: [] };
   courses.forEach((c) => {
      if (yearGroups[c.year]) yearGroups[c.year].push(c);
   });
   const specOrder = { common: 0, se: 1, ia: 2 };
   Object.values(yearGroups).forEach((group) => {
      group.sort((a, b) => (specOrder[a.specialization] || 0) - (specOrder[b.specialization] || 0));
   });

   const containerWidth = timelineChart.getWidth();
   const containerHeight = timelineChart.getHeight();
   const marginX = 120;
   const marginY = 40;
   const usableWidth = containerWidth - marginX * 2;
   const usableHeight = containerHeight - marginY * 2;
   const yearSpacing = usableWidth / 3;

   const nodes = [];
   Object.entries(yearGroups).forEach(([year, group]) => {
      const yearIdx = parseInt(year) - 1;
      const x = marginX + yearIdx * yearSpacing;
      const ySpacing = usableHeight / (group.length + 1);

      group.forEach((course, idx) => {
         const y = marginY + (idx + 1) * ySpacing;
         const isSelected = course.code === nodeId;
         const isPrereq = visitedPrereqs.has(course.code) && !isSelected;
         const isConnected = isSelected || isPrereq;

         nodes.push({
            id: course.code,
            name: course.name,
            code: course.code,
            credits: course.credits,
            specialization: course.specialization,
            year: course.year,
            x: x,
            y: y,
            fixed: true,
            z: isSelected ? 10 : isConnected ? 5 : 1,
            symbolSize: isSelected
               ? Math.max(30, Math.min(50, course.credits * 4))
               : Math.max(20, Math.min(40, course.credits * 3)),
            label: {
               show: true,
               fontSize: isSelected ? 15 : isConnected ? 13 : 11,
               fontWeight: isSelected ? "bold" : "normal",
               color: isConnected ? getSpecColor(course.specialization) : "#ccc",
               opacity: isConnected ? 1 : 0.3,
               position: "right",
               distance: 8,
               formatter: function (p) {
                  const name = p.data.name;
                  return name.length > 30 ? name.substring(0, 28) + "\u2026" : name;
               },
               textBorderColor: "#fff",
               textBorderWidth: 2,
            },
            itemStyle: {
               color: isSelected
                  ? getSpecColor(course.specialization)
                  : isConnected
                  ? getSpecColor(course.specialization)
                  : "#ddd",
               borderColor: isSelected ? getSpecColor(course.specialization) : "#fff",
               borderWidth: isSelected ? 3 : 2,
               shadowBlur: isSelected ? 10 : 4,
               shadowColor: isSelected ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.15)",
               opacity: isConnected ? 1 : 0.4,
            },
         });
      });
   });

   const edgeLinks = links.map((link) => {
      const isPrereqLink = prereqLinks.find(
         (pl) => pl.source === link.source && pl.target === link.target
      );

      if (isPrereqLink) {
         const srcCourse = curriculum.courses.find((c) => c.code === link.source);
         const linkColor = srcCourse ? getSpecColor(srcCourse.specialization) : "#94a3b8";
         return {
            source: link.source,
            target: link.target,
            lineStyle: {
               color: linkColor,
               width: 3,
               opacity: 1,
               curveness: 0.15,
            },
         };
      } else {
         return {
            source: link.source,
            target: link.target,
            lineStyle: {
               color: "#eee",
               width: 1,
               opacity: 0.15,
               curveness: 0.15,
            },
         };
      }
   });

   timelineChart.setOption(
      {
         series: [{ data: nodes, links: edgeLinks }],
      },
      false
   );
}

function refreshTimeline() {
   if (timelineChart) {
      renderTimeline();
      if (currentSelectedCourse) {
         highlightTimelineNode(currentSelectedCourse);
      }
   }
}

function setSpecFilter(filter) {
   currentSpecFilter = filter;

   // Update button states
   document.querySelectorAll(".spec-btn").forEach((btn) => {
      btn.classList.remove("active");
   });
   const activeBtn = document.querySelector(`.spec-btn[data-filter="${filter}"]`);
   if (activeBtn) activeBtn.classList.add("active");

   // Re-render the active view
   const currentView = document.querySelector('.view-btn.active')?.dataset?.view || 'timeline';
   if (currentView === "timeline" && timelineChart) {
      renderTimeline();
   } else if (currentView === "graph" && chart) {
      setupGraphWithFilter();
   }
}

function setupGraphWithFilter() {
   const courses = getFilteredCourses();
   const links = getFilteredLinks();

   const nodes = courses.map((course) => ({
      id: course.code,
      name: course.name,
      code: course.code,
      credits: course.credits,
      specialization: course.specialization,
      symbolSize: 30,
      label: {
         show: true,
         fontSize: 13,
         color: getSpecColor(course.specialization),
         opacity: 1,
         textBorderColor: "#fff",
         textBorderWidth: 2,
      },
      itemStyle: {
         color: getSpecColor(course.specialization),
         opacity: 0,
      },
   }));

   const edgeLinks = links.map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: {
         curveness: 0.2,
         color: getLinkColor(link),
      },
   }));

   chart.setOption(
      {
         series: [
            {
               data: nodes,
               links: edgeLinks,
            },
         ],
      },
      false
   );
}
