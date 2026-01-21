async function init() {
   setupGraph();
   setupAdminMode();

   loadCustomGraph().then(() => {
      if (chart) {
         refreshGraph();
         const graphDiv = document.getElementById("graph");
         if (graphDiv) {
            graphDiv.style.opacity = "1";
         }
      }
   });
}

window.addEventListener("DOMContentLoaded", init);
