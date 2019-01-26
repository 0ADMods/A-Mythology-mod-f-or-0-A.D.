const preMythologyInit = init;
init = function(initData, hotloadData)
{
	preMythologyInit(initData, hotloadData);
	openDeitySelection(); // needs to be in here so it can use g_CivData (deity_selection.js would run before this file)

	// top_panel/label.xml
	// Remember to update pregame/mainmenu_millenniumad.js in sync with this:
	// Translation: Game/Mod name as found at the top of the in-game user interface
	Engine.GetGUIObjectByName("alphaLabel").caption = sprintf(translate("%(title)s %(version)s : %(subtitle)s"), {
		"title": translate("Mythology A.D."),
		"subtitle": translate("Demo"),
		"version": translate("ALPHA XXIII")
	});
}
