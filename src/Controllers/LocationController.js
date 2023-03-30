/**
 * Location Controller
 */
class LocationController 
{

    /**
     * Create an additional custom Bot Spawn Point - CREDIT: JustNU
     * @param {*} spawnPointName 
     * @param {*} xCoordinate 
     * @param {*} yCoordinate 
     * @param {*} zCoordinate 
     * @param {*} map 
     * @param {*} botZoneName 
     */
	static createBotSpawnPoint(spawnPointName, xCoordinate, yCoordinate, zCoordinate, map, botZoneName) 
	{
		let correctYCoordinate = (yCoordinate - 1.5);
		
		let spawnPoint = {
			"Id": `${spawnPointName}-${map}-${botZoneName}-BOT`,
			"Position": {
				"x": xCoordinate,
				"y": correctYCoordinate,
				"z": zCoordinate
			},
			"Rotation": 0,
			"Sides": [
				"Savage"
			],
			"Categories": [
				"Bot"
			],
			"Infiltration": "",
			"DelayToCanSpawnSec": 4,
			"ColliderParams": {
				"_parent": "SpawnSphereParams",
				"_props": {
					"Center": {
						"x": 0,
						"y": 0,
						"z": 0
					},
					"Radius": 20
				}
			},
			"BotZoneName": botZoneName
		}
		
		global._database.locations[map].base.SpawnPointParams.push(spawnPoint)
	}
	
    /**
     * Create an additional custom Spawn Point - CREDIT: JustNU
     * @param {*} spawnPointName 
     * @param {*} xCoordinate 
     * @param {*} yCoordinate 
     * @param {*} zCoordinate 
     * @param {*} rotation 
     * @param {*} map 
     */
	static createSpawnPoint(spawnPointName, xCoordinate, yCoordinate, zCoordinate, rotation, map) 
	{
		let correctYCoordinate = (yCoordinate - 1.5);
		
		let spawnPoint = {
			"Id": `${spawnPointName}-${map}`,
			"Position": {
				"x": xCoordinate,
				"y": correctYCoordinate,
				"z": zCoordinate
			},
			"Rotation": rotation,
			"Sides": [
				"All"
			],
			"Categories": [
				"Player"
			],
			"Infiltration": "",
			"DelayToCanSpawnSec": 4,
			"ColliderParams": {
				"_parent": "SpawnSphereParams",
				"_props": {
					"Center": {
						"x": 0,
						"y": 0,
						"z": 0
					},
					"Radius": 20
				}
			}
		}
		
		global._database.locations[map].base.SpawnPointParams.push(spawnPoint)
	}
	
}

module.exports.LocationController = LocationController;
