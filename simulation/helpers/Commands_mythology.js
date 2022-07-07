g_Commands["run"] = function(player, cmd, data)
{
    GetFormationUnitAIs(data.entities, player).forEach(cmpUnitAI => {
        cmpUnitAI.Run(cmd.x, cmd.z, cmd.queued);
    });
};
