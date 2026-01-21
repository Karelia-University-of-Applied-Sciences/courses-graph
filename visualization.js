let chart;
let originalOption;

function setupGraph() {
   const nodes = curriculum.courses.map((course) => ({
      id: course.code,
      name: course.name,
      code: course.code,
      credits: course.credits,
      symbolSize: 30,
      label: {
         show: true,
         fontSize: 10,
         opacity: 1,
         textBorderColor: "#fff",
         textBorderWidth: 2,
      },
      itemStyle: {
         color: "#4CAF50",
         opacity: 0,
      },
   }));

   const links = getMergedGraph().map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: {
         curveness: 0.2,
      },
   }));

   chart = echarts.init(document.getElementById("graph"));

   originalOption = {
      tooltip: {
         formatter: function (params) {
            if (params.dataType === "node") {
               return `<strong>${params.data.code}</strong><br/>${params.data.credits} credits`;
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
               fontSize: 9,
               formatter: "{b}",
            },
            edgeSymbol: ["none", "arrow"],
            edgeSymbolSize: 8,
            force: {
               repulsion: 1000,
               gravity: 0.4,
               edgeLength: 100,
               elasticity: 0.2,
               layoutAnimation: true,
            },
            emphasis: {
               label: {
                  fontSize: 12,
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
         const courseName = params.data.name;

         const searchInput = document.getElementById("search");
         if (searchInput) {
            searchInput.value = courseName;
         }

         highlightNode(courseCode);
         selectCourseForAdmin(courseCode);
      }
   });

   setupSearch();

   window.addEventListener("resize", function () {
      chart.resize();
   });
}

function highlightNode(nodeId) {
   const links = getMergedGraph().map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: {
         curveness: 0.2,
      },
   }));

   const nodes = curriculum.courses.map((course) => ({
      id: course.code,
      name: course.name,
      code: course.code,
      credits: course.credits,
      symbolSize: 30,
   }));

   const nodeDepths = new Map();
   const visitedPrereqs = new Set();
   const prerequisiteLinks = [];
   const dependencyNodes = new Set();

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

   links.forEach((link) => {
      if (link.source === nodeId) {
         dependencyNodes.add(link.target);
      }
   });

   const maxDepth = Math.max(...Array.from(nodeDepths.values()), 0);

   const highlightedNodes = nodes.map((node) => {
      const isSelected = node.id === nodeId;
      const isPrerequisite = nodeDepths.has(node.id) && node.id !== nodeId;
      const isConnected = isSelected || isPrerequisite;

      return {
         ...node,
         itemStyle: {
            color: isSelected ? "#FF9800" : isConnected ? "#4CAF50" : "#ccc",
            opacity: 0,
         },
         label: {
            show: true,
            fontSize: isSelected ? 12 : isConnected ? 10 : 8,
            fontWeight: isSelected ? "bold" : "normal",
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
         const invDepth = 1 - prereqLink.depth / (maxDepth + 1);
         const opacity = maxDepth > 0 ? invDepth * 0.9 : 1;
         return {
            ...link,
            lineStyle: {
               color: "#FF5722",
               width: invDepth * 3,
               opacity: opacity,
               curveness: 0.2,
            },
         };
      } else {
         return {
            ...link,
            lineStyle: {
               color: "#ccc",
               width: 1,
               opacity: 1,
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
   chart.setOption(originalOption);
}

function setupSearch() {
   const searchInput = document.getElementById("search");

   searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      if (searchTerm === "") {
         resetGraph();
         return;
      }
      const matchedCourse = curriculum.courses.find(
         (c) =>
            c.code.toLowerCase().includes(searchTerm) ||
            c.name.toLowerCase().includes(searchTerm),
      );

      if (matchedCourse) {
         highlightNode(matchedCourse.code);
         selectCourseForAdmin(matchedCourse.code);
      }
   });
}

function refreshGraph() {
   const newLinks = getMergedGraph().map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: { curveness: 0.2 },
   }));

   chart.setOption({
      series: [{ links: newLinks }],
   });

   if (currentSelectedCourse) {
      highlightNode(currentSelectedCourse);
   }
}
