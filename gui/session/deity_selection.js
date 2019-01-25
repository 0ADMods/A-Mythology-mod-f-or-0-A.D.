var g_Deities;

function openDeitySelection()
{
	g_Deities = g_CivData[g_Players[g_ViewedPlayer].civ].Deities;

	for (let i = 0; i < 3; ++i)
	{
		Engine.GetGUIObjectByName("deity_container[" + i + "]").size = ((33 * (i+1)) - 33) + "%+5 0%+5 " + (33 * (i+1)) + "%-5 100%-5";

		let button = Engine.GetGUIObjectByName("deity_button[" + i + "]");
		button.onPress = (function(i){return function(){chooseDeity(i)}})(i);
		
		Engine.GetGUIObjectByName("deity_portrait[" + i + "]").sprite = "stretched:session/portraits/deities/" + g_Deities[i].name + ".png";

		let title = Engine.GetGUIObjectByName("deity_title[" + i + "]");
		title.caption = g_Deities[i].name;

		let infobox = Engine.GetGUIObjectByName("deity_infobox[" + i + "]");
		infobox.caption = formatBonusesInfoBox(g_Deities[i]);
	}

	// customize background to civ specific ones
	// let background = Engine.GetGUIObjectByName("deity_background");
}

function chooseDeity(id)
{
	// get the corresponding name from index
	Engine.PostNetworkCommand({ "type": "deity-selection", "name": g_Deities[id] });
	
	// once selected, grey out the other 2
	for (let i = 0; i < 3; ++i)
	{
		let button = Engine.GetGUIObjectByName("deity_button[" + i + "]");
		button.enabled = false;
		
		if (i != id)
			Engine.GetGUIObjectByName("deity_portrait[" + i + "]").sprite = "color:0 0 0 127:grayscale:stretched:session/portraits/deities/" + g_Deities[i].name + ".png";
	}

	Engine.GetGUIObjectByName("deity_selection").hidden = true;
}

function formatBonusesInfoBox(deity)
{
	let result = "[color=\"white\"]• " + deity.description + "[/color]\n\nGod powers:";
	for (let power of deity.godPowers)
		result += "\n - " + power.name + ": " + power.description;
	
	result += "\n\nGod bonuses:"
	for (let bonus of deity.Bonuses)
		result += "\n - " + bonus.name + ": " + bonus.description;

	result += "\n\nMyth units: "
	for (let unit of deity.mythUnits)
		result += unit + ", ";
		
	result += "\nHero: " + deity.hero
	return result;
}
