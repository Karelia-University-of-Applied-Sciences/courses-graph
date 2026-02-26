let chart;
let originalOption;

function setupGraph() {
   const courses = getFilteredCourses();
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
         opacity: 1,
         color: getSpecColor(course.specialization),
         textBorderColor: "#fff",
         textBorderWidth: 2,
      },
      itemStyle: {
         color: getSpecColor(course.specialization),
         opacity: 0,
      },
   }));

   const links = getFilteredLinks().map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: {
         curveness: 0.2,
         color: getLinkColor(link),
      },
   }));

   chart = echarts.init(document.getElementById("graph"));

   originalOption = {
      tooltip: {
         formatter: function (params) {
            if (params.dataType === "node") {
               const spec = getSpecLabel(params.data.specialization || 'common');
               return `<strong>${params.data.code}</strong><br/>${params.data.credits} credits<br/><em>${spec}</em>`;
            }
            return "";
         },
      },
      series: [
         {
            type: "graph",
            layout: "force",
            data: nodes,
            links: links,
            roam: true,
            label: {
               show: true,
               position: "inside",
               fontSize: 13,
               formatter: "{b}",
            },
            edgeSymbol: ["none", "arrow"],
            edgeSymbolSize: 12,
            force: {
               repulsion: 1000,
               gravity: 0.4,
               edgeLength: 100,
               elasticity: 0.2,
               layoutAnimation: true,
            },
            emphasis: {
               label: {
                  fontSize: 16,
                  fontWeight: "bold",
               },
            },
            lineStyle: {
               color: "#999",
               curveness: 0.2,
               width: 2,
            },
         },
      ],
   };

   chart.setOption(originalOption);

   chart.on("click", function (params) {
      if (params.dataType === "node") {
         const courseCode = params.data.id;

         const searchInput = document.getElementById("search");
         const searchResults = document.getElementById("searchResults");
         if (searchInput) {
            searchInput.value = `${params.data.code} - ${params.data.name}`;
         }
         if (searchResults) searchResults.style.display = "none";

         highlightNode(courseCode);
         selectCourseForAdmin(courseCode);
      }
   });

   chart.getZr().on("click", function (e) {
      if (!e.target) {
         deselectCourse();
      }
   });

   window.addEventListener("resize", function () {
      chart.resize();
   });
}

function highlightNode(nodeId) {
   const filteredCourses = getFilteredCourses();
   const links = getFilteredLinks().map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: {
         curveness: 0.2,
      },
   }));

   const nodes = filteredCourses.map((course) => ({
      id: course.code,
      name: course.name,
      code: course.code,
      credits: course.credits,
      specialization: course.specialization,
      symbolSize: 30,
   }));

   const nodeDepths = new Map();
   const visitedPrereqs = new Set();
   const prerequisiteLinks = [];

   function findPrerequisites(currentNode, depth = 0) {
      if (visitedPrereqs.has(currentNode)) return;
      visitedPrereqs.add(currentNode);

      if (!nodeDepths.has(currentNode) || nodeDepths.get(currentNode) > depth) {
         nodeDepths.set(currentNode, depth);
      }

      links.forEach((link) => {
         if (link.target === currentNode) {
            prerequisiteLinks.push({ ...link, depth: depth });
            findPrerequisites(link.source, depth + 1);
         }
      });
   }

   findPrerequisites(nodeId);

   const maxDepth = Math.max(...Array.from(nodeDepths.values()), 0);

   const highlightedNodes = nodes.map((node) => {
      const isSelected = node.id === nodeId;
      const isPrerequisite = nodeDepths.has(node.id) && node.id !== nodeId;
      const isConnected = isSelected || isPrerequisite;

      return {
         ...node,
         z: isSelected ? 10 : isConnected ? 5 : 1,
         itemStyle: {
            color: isSelected ? getSpecColor(node.specialization || 'common') : isConnected ? getSpecColor(node.specialization || 'common') : "#ccc",
            opacity: 0,
         },
         label: {
            show: true,
            fontSize: isSelected ? 16 : isConnected ? 14 : 11,
            fontWeight: isSelected ? "bold" : "normal",
            color: isConnected ? getSpecColor(node.specialization || 'common') : "#ccc",
            opacity: isConnected ? 1 : 0.5,
            textBorderColor: "#fff",
            textBorderWidth: 2,
         },
      };
   });

   const highlightedLinks = links.map((link) => {
      const prereqLink = prerequisiteLinks.find(
         (pl) => pl.source === link.source && pl.target === link.target,
      );

      if (prereqLink) {
         const srcCourse = curriculum.courses.find((c) => c.code === link.source);
         const linkColor = srcCourse ? getSpecColor(srcCourse.specialization) : "#94a3b8";
         return {
            ...link,
            lineStyle: {
               color: linkColor,
               width: 3,
               opacity: 1,
               curveness: 0.2,
            },
         };
      } else {
         return {
            ...link,
            lineStyle: {
               color: "#eee",
               width: 1,
               opacity: 0.15,
               curveness: 0.2,
            },
         };
      }
   });

   chart.setOption({
      series: [
         {
            data: highlightedNodes,
            links: highlightedLinks,
         },
      ],
   });
}

function resetGraph() {
   if (chart && originalOption) chart.setOption(originalOption);
}

function refreshGraph() {
   if (!chart) return;
   const newLinks = getFilteredLinks().map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: { curveness: 0.2, color: getLinkColor(link) },
   }));

   chart.setOption({
      series: [{ links: newLinks }],
   });

   if (currentSelectedCourse) {
      highlightNode(currentSelectedCourse);
   }
}
