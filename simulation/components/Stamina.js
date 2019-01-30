function Stamina() {}

Stamina.prototype.Schema =
	"<element name='MaxPoints'>"+
		"<ref name='positiveDecimal'/>" +
	"</element>"+
	"<element name='RegenRate'>" +
		"<ref name='nonNegativeDecimal'/>" +
	"</element>"+
	"<element name='RunDegRate'>" +
		"<ref name='positiveDecimal'/>"+
	"</element>"
	;

Stamina.prototype.Init = function()
{
	this.maxPoints = +this.template.MaxPoints;
	this.stamina = +this.template.MaxPoints;
	this.runDegRate = ApplyValueModificationsToEntity("Stamina/RunDegRate", +this.template.RunDegRate, this.entity);
	this.regenRate = ApplyValueModificationsToEntity("Stamina/RegenRate", +this.template.RegenRate, this.entity);
	this.CheckRegenTimer();
}

Stamina.prototype.GetPoints = function()
{
	return this.stamina;
}

Stamina.prototype.GetMaxPoints = function()
{
	return this.maxPoints;
}

Stamina.prototype.GetRegenRate = function()
{
	return this.regenRate;
}

Stamina.prototype.GetPercentage = function()
{
	return this.stamina / this.maxPoints;
}

Stamina.prototype.GetRunDegRate = function()
{
	return this.runDegRate;
}

Stamina.prototype.CancelRunningTimer = function()
{
	if (!this.runTimer)
		return;

	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	cmpTimer.CancelTimer(this.runTimer);
	this.runTimer = undefined;
}

Stamina.prototype.CancelRegenerationTimer = function()
{
	if (!this.staminaTimer)
		return;

	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	cmpTimer.CancelTimer(this.staminaTimer);
	this.staminaTimer = undefined;
}

Stamina.prototype.SetPoints = function(value)
{
	// Before changing the value, activate Fogging if necessary to hide changes
	let cmpFogging = Engine.QueryInterface(this.entity, IID_Fogging);
	if (cmpFogging)
		cmpFogging.Activate();

	let old = this.stamina;
	this.stamina = Math.max(0, Math.min(this.GetMaxPoints(), value));

	this.RegisterStaminaChange(old);
}

Stamina.prototype.ExecuteRegeneration = function()
{
	let regen = this.GetRegenRate();
	let cmpUnitAI = Engine.QueryInterface(this.entity, IID_UnitAI);
	if (!cmpUnitAI)
		return;

	if (cmpUnitAI.IsIdle() || cmpUnitAI.IsGarrisoned() && !cmpUnitAI.IsTurret())
		this.Increase(regen);
}

Stamina.prototype.ExecuteRunDegredation = function()
{
	let deg = this.GetRunDegRate();
	let cmpUnitAI = Engine.QueryInterface(this.entity, IID_UnitAI);
	if (!cmpUnitAI)
		return;

	if (cmpUnitAI.IsRunning()) {
		this.Reduce(deg);
		if (this.amount > 0)
			return;
	}

	this.CancelRunningTimer();
}

Stamina.prototype.CheckRegenTimer = function()
{
	if (this.GetRegenRate() == 0 || this.GetPoints() == this.GetMaxPoints())
	{
		if (this.staminaTimer)
		{
			let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
			cmpTimer.CancelTimer(this.staminaTimer);
			this.staminaTimer = undefined;
		}
		return;
	}

	if (this.staminaTimer)
		return;

	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	this.staminaTimer = cmpTimer.SetInterval(this.entity, IID_Stamina, "ExecuteRegeneration", 1000, 1000, null);
}

Stamina.prototype.StartRunTimer = function()
{
	if (this.GetRunDegRate() == 0 || !this.amount)
	{
		if (this.runTimer)
		{
			let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
			cmpTimer.CancelTimer(this.runTimer);
			this.runTimer = undefined;
		}
		return;
	}

	if (this.runTimer)
		return;

	let cmpTimer = Engine.QueryInterface(SYSTEM_ENTITY, IID_Timer);
	this.runTimer = cmpTimer.SetInterval(this.entity, IID_Stamina, "ExecuteRunDegredation", 1000, 1000, null);

	if (this.staminaTimer)
		this.CancelRegenerationTimer();
}

Stamina.prototype.Reduce = function(amount)
{
	if (amount < 0 || amount == 0){
		warn("Tried to reduce stamina by negative or zero value: " + amount);
		return;
	}

	// Before changing the value, activate Fogging if necessary to hide changes
	let cmpFogging = Engine.QueryInterface(this.entity, IID_Fogging);
	if (cmpFogging)
		cmpFogging.Activate();

	let old = this.stamina;
	this.stamina = Math.max(0, this.stamina - amount);
	this.RegisterStaminaChange(old);
}

Stamina.prototype.Increase = function(amount)
{
	// Before changing the value, activate Fogging if necessary to hide changes
	let cmpFogging = Engine.QueryInterface(this.entity, IID_Fogging);
	if (cmpFogging)
		cmpFogging.Activate();

	if (this.stamina == this.GetMaxPoints())
		return {"old": this.stamina, "new":this.stamina};

	let old = this.stamina;
	this.stamina = Math.min(this.stamina + amount, this.GetMaxPoints());

	this.RegisterStaminaChange(old);

	return {"old": old, "new": this.stamina};
}

Stamina.prototype.OnValueModification = function(msg)
{
	if(msg.component != "Stamina")
		return;

	let oldMaxPoints = this.GetMaxPoints();
	let newMaxPoints = ApplyValueModificationsToEntity("Stamina/MaxPoints", +this.template.MaxPoints, this.entity);
	if (oldMaxPoints != newMaxPoints)
	{
		let newPoints = this.GetPoints() * newMaxPoints/oldMaxPoints;
		this.maxPoints = newMaxPoints;
		this.SetPoints(newPoints);
	}

	let oldRegenRate = this.regenRate;
	this.regenRate = ApplyValueModificationsToEntity("Stamina/RegenRate", +this.template.RegenRate, this.entity);

	let oldDegRate = this.runDegRate;
	this.runDegRate = ApplyValueModificationsToEntity("Stamina/RunDegRate", +this.template.RunDegRate, this.entity);

	if (this.regenRate != oldRegenRate)
		this.CheckRegenTimer();
}

Stamina.prototype.RegisterStaminaChange = function(from)
{
	this.CheckRegenTimer();
	Engine.PostMessage(this.entity, MT_StaminaChanged, { "from": from, "to": this.stamina });
}

Engine.RegisterComponentType(IID_Stamina, "Stamina", Stamina);