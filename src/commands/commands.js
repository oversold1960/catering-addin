/*
 * commands.js
 * -----------
 * Steuert den Menüband-Button "Catering bestellen" im Termin-Organizer-Fenster.
 * Der Button wirkt wie ein Ein/Aus-Schalter:
 *  - 1. Klick  -> Task Pane mit dem Catering-Formular öffnen
 *  - 2. Klick  -> Task Pane wieder schließen
 * Der Zustand ("bereits angefragt?") wird zusätzlich über eine Custom Property
 * am Termin-Element gespiegelt, damit der Button auch nach Schließen/erneutem
 * Öffnen des Termins den richtigen Status zeigt.
 */

Office.onReady(() => {
  // Beim Laden des Termins prüfen, ob für diesen Termin bereits eine
  // Catering-Anfrage gestellt wurde, und den Button entsprechend beschriften.
  refreshButtonStateFromItem();
});

let paneVisible = false;

function toggleCateringPane(event) {
  if (!paneVisible) {
    Office.addin.showAsTaskpane()
      .then(() => {
        paneVisible = true;
        updateRibbon("Formular schließen");
        event.completed();
      })
      .catch((error) => {
        console.error("showAsTaskpane fehlgeschlagen:", error);
        event.completed();
      });
  } else {
    Office.addin.hideAsTaskpane()
      .then(() => {
        paneVisible = false;
        refreshButtonStateFromItem(event);
      })
      .catch((error) => {
        console.error("hideAsTaskpane fehlgeschlagen:", error);
        event.completed();
      });
  }
}

// Liest die Custom Property "CateringRequested" des Termins aus und setzt
// das Button-Label passend ("Catering bestellen" vs. "Catering angefragt ✓").
function refreshButtonStateFromItem(event) {
  const item = Office.context.mailbox.item;
  if (!item || !item.loadCustomPropertiesAsync) {
    updateRibbon("Catering bestellen");
    if (event) event.completed();
    return;
  }
  item.loadCustomPropertiesAsync((result) => {
    let label = "Catering bestellen";
    if (result.status === Office.AsyncResultStatus.Succeeded) {
      const props = result.value;
      if (props.get("CateringRequested") === "true") {
        label = "Catering angefragt ✓";
      }
    }
    updateRibbon(label);
    if (event) event.completed();
  });
}

function updateRibbon(label) {
  Office.ribbon.requestUpdate({
    tabs: [
      {
        id: "TabDefault",
        groups: [
          {
            id: "CateringGroup",
            controls: [
              {
                id: "CateringToggleButton",
                label: label,
                enabled: true
              }
            ]
          }
        ]
      }
    ]
  }).catch((error) => console.error("Ribbon-Update fehlgeschlagen:", error));
}

// Für Office.js verpflichtend: Funktion(en) aus dem Manifest registrieren.
Office.actions.associate("toggleCateringPane", toggleCateringPane);
