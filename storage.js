let customGraph = [];

function showLoading(show) {
   const legend = document.getElementById("legend");
   legend.innerHTML = "⏳ Syncing...";
   if (!show) {
      legend.innerHTML = "Click or search for a course to view connections. Mouse wheel to zoom.";
   }
}

async function loadCustomGraph() {
   if (!API_KEY || !BIN_ID) {
      console.log("API configuration not set - using default graph only");
      return;
   }

   showLoading(true);

   try {
      const response = await fetch(`${API_URL}${BIN_ID}/latest`, {
         method: "GET",
         headers: {
            "X-Master-Key": API_KEY,
         },
      });

      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      customGraph = data.record || [];
      console.log("Loaded custom graph:", customGraph);
   } catch (err) {
      console.error("Failed to load:", err);
      alert("Failed to load data from server: " + err.message);
      customGraph = [];
   } finally {
      showLoading(false);
   }
}

async function saveCustomGraph() {
   if (!API_KEY || !BIN_ID) {
      console.log("API not configured - changes stored locally only");
      return;
   }

   showLoading(true);
   try {
      const dataToSave = customGraph.length > 0 ? customGraph : [{ action: "placeholder" }];

      const response = await fetch(`${API_URL}${BIN_ID}`, {
         method: "PUT",
         headers: {
            "Content-Type": "application/json",
            "X-Master-Key": API_KEY,
         },
         body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
         const errorText = await response.text();
         console.error("Server response:", errorText);
         throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Saved successfully!");
   } catch (err) {
      console.error("Failed to save:", err);
      alert("Error saving to server: " + err.message);
   } finally {
      showLoading(false);
   }
}

function getMergedGraph() {
   const merged = [...graph];
   const validCustom = customGraph.filter((c) => c.action !== "placeholder");

   validCustom.forEach((custom) => {
      if (custom.action === "add") {
         if (
            !merged.find(
               (link) =>
                  link.source === custom.source &&
                  link.target === custom.target,
            )
         ) {
            merged.push({ source: custom.source, target: custom.target });
         }
      } else if (custom.action === "remove") {
         const idx = merged.findIndex(
            (link) =>
               link.source === custom.source && link.target === custom.target,
         );
         if (idx >= 0) merged.splice(idx, 1);
      }
   });

   return merged;
}
