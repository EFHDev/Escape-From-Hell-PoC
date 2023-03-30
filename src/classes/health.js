"use strict";

/* HealthServer class maintains list of health for each sessionID in memory. */
class HealthServer {
  constructor() {
    this.healths = {};
    this.effects = {};
  }

  freeFromMemory(sessionID) {
    delete this.healths[sessionID];
  }

  /* resets the healh response */
  initializeHealth(sessionID) {
    this.healths[sessionID] = {
      Hydration: 0,
      Energy: 0,
      Head: 0,
      Chest: 0,
      Stomach: 0,
      LeftArm: 0,
      RightArm: 0,
      LeftLeg: 0,
      RightLeg: 0,
    };
    this.effects[sessionID] = {
      Head: {},
      Chest: {},
      Stomach: {},
      LeftArm: {},
      RightArm: {},
      LeftLeg: {},
      RightLeg: {},
    };

    return this.healths[sessionID];
  }

  // setHealth(sessionID) {
  //     return this.health[sessionID] || this.initializeHealth(sessionID);
  // }

  offraidHeal(pmcData, body, sessionID) {
    let output = item_f.handler.getOutput(sessionID);

    // update medkit used (hpresource)
    for (let item of pmcData.Inventory.items) {
      if (item._id === body.item) {
        if (!("upd" in item)) {
          item.upd = {};
        }

        if ("MedKit" in item.upd) {
          item.upd.MedKit.HpResource -= body.count;
        } else {
          let maxhp = helper_f.tryGetItem(item._tpl)._props.MaxHpResource;
          item.upd.MedKit = { HpResource: maxhp - body.count };
        }

        if (item.upd.MedKit.HpResource === 0) {
          move_f.removeItem(pmcData, body.item, sessionID);
        }
      }
    }

    return output;
  }

  offraidEat(pmcData, body, sessionID) {
    let output = item_f.handler.getOutput(sessionID);
    let resourceLeft;
    let maxResource = {};

    for (let item of pmcData.Inventory.items) {
      if (item._id === body.item) {
        let itemProps = helper_f.tryGetItem(item._tpl)._props;
        maxResource = itemProps.MaxResource;

        if (maxResource > 1) {
          if ("FoodDrink" in item.upd) {
            item.upd.FoodDrink.HpPercent -= body.count;
          } else {
            item.upd.FoodDrink = { HpPercent: maxResource - body.count };
          }

          resourceLeft = item.upd.FoodDrink.HpPercent;
        }
      }
    }

    if (maxResource === 1 || resourceLeft < 1) {
      output = move_f.removeItem(pmcData, body.item, sessionID);
    }

    return output;
  }

  /* stores in-raid player health */
  saveHealth(pmcData, info, sessionID) {
    let nodeHealth = this.healths[sessionID];
    let nodeEffects = this.effects[sessionID];
    let BodyPartsList = info.Health;
    nodeHealth.Hydration = info.Hydration;
    nodeHealth.Energy = info.Energy;

    for (let bodyPart of Object.keys(BodyPartsList)) {
      if (BodyPartsList[bodyPart].Effects != undefined) {
        nodeEffects[bodyPart] = BodyPartsList[bodyPart].Effects;
      }

      if (info.IsAlive === true) {
        nodeHealth[bodyPart] = BodyPartsList[bodyPart].Current;
      } else {
        nodeHealth[bodyPart] = -1;
      }
    }

    this.applyHealth(pmcData, sessionID);
  }

  /* stores the player health changes */
  updateHealth(info, sessionID) {
    let node = this.healths[sessionID];

    switch (info.type) {
      /* store difference from infill */
      case "HydrationChanged":
      case "EnergyChanged":
        node[info.type.replace("Changed", "")] += parseInt(info.diff);
        break;

      /* difference is already applies */
      case "HealthChanged":
        node[info.bodyPart] = info.value;
        break;

      /* store state and make server aware to kill all body parts */
      case "Died":
        node = {
          Hydration: this.healths[sessionID].Hydration,
          Energy: this.healths[sessionID].Energy,
          Head: -1,
          Chest: -1,
          Stomach: -1,
          LeftArm: -1,
          RightArm: -1,
          LeftLeg: -1,
          RightLeg: -1,
        };
        break;
    }

    this.healths[sessionID] = node;
  }

  healOverTime(pmcData, info, sessionID) {

    if(!pmcData)
      return;

    const pmcHealth = pmcData.Health;
    const bodyParts = pmcHealth.BodyParts;
    const LastUpdate = pmcHealth.UpdateTime;
    const NewUpdate = utility.getTimestamp();
    const TimeElapsedFactor = (NewUpdate - LastUpdate) / 60;
    if (TimeElapsedFactor < 1) return;
    /*
            INFO: values saved in Bonuses are smaller then actual values they need to be divided by 2 (and then multiplied by 9 if its health)
        */
    function GetNumberOfDamagedBodyParts(pmcData, GetBodyParts) {
      let countBodyPartsToUpdate = 0;
      for (const bodyPart in GetBodyParts) {
        if (bodyParts[GetBodyParts[bodyPart]].Health.Current < bodyParts[GetBodyParts[bodyPart]].Health.Maximum) {
          countBodyPartsToUpdate++;
        }
      }
      return countBodyPartsToUpdate;
    }
    const healthRegenBonuses = pmcData.Bonuses.filter((bonus) => bonus.type === "HealthRegeneration");
    let healthRegen = 8;
    healthRegenBonuses.forEach((bonus) => {
      healthRegen += (bonus.value / 2) * 9;
    });
    healthRegen *= TimeElapsedFactor;

    const energyRegenBonuses = pmcData.Bonuses.filter((bonus) => bonus.type === "EnergyRegeneration");
    let energyRegen = 1;
    energyRegenBonuses.forEach((bonus) => {
      energyRegen += bonus.value / 2;
    });
    energyRegen *= TimeElapsedFactor;

    const hydrationRegenBonuses = pmcData.Bonuses.filter((bonus) => bonus.type === "HydrationRegeneration");
    let hydrationRegen = 1;
    hydrationRegenBonuses.forEach((bonus) => {
      hydrationRegen += bonus.value / 2;
    });
    hydrationRegen *= TimeElapsedFactor;

    const GetBodyParts = Object.keys(pmcHealth.BodyParts);
    const updateBodyPartPer = healthRegen / GetNumberOfDamagedBodyParts(pmcData, GetBodyParts);

    logger.logInfo(
      `Updating Health for: ${sessionID} [Health:${healthRegen}/min (${updateBodyPartPer}/BodyPart)] [Energy:${energyRegen}/min] [Hydration:${hydrationRegen}/min]`
    );

    for (const bodyPart in GetBodyParts) {
      if (bodyParts[GetBodyParts[bodyPart]].Health.Current < bodyParts[GetBodyParts[bodyPart]].Health.Maximum) {
        bodyParts[GetBodyParts[bodyPart]].Health.Current += updateBodyPartPer;
        if (bodyParts[GetBodyParts[bodyPart]].Health.Current > bodyParts[GetBodyParts[bodyPart]].Health.Maximum) {
          bodyParts[GetBodyParts[bodyPart]].Health.Current = bodyParts[GetBodyParts[bodyPart]].Health.Maximum;
        }
      }
    }
    if (pmcHealth.Energy.Current < pmcHealth.Energy.Maximum) {
      pmcHealth.Energy.Current += energyRegen;
      if (pmcHealth.Energy.Current > pmcHealth.Energy.Maximum) {
        pmcHealth.Energy.Current = pmcHealth.Energy.Maximum;
      }
    }
    if (pmcHealth.Hydration.Current < pmcHealth.Hydration.Maximum) {
      pmcHealth.Hydration.Current += hydrationRegen;
      if (pmcHealth.Hydration.Current > pmcHealth.Hydration.Maximum) {
        pmcHealth.Hydration.Current = pmcHealth.Hydration.Maximum;
      }
    }
  }

  healthTreatment(pmcData, info, sessionID) {
    let body = {
      Action: "RestoreHealth",
      tid: "54cb57776803fa99248b456e",
      scheme_items: info.items,
    };
    helper_f.payMoney(pmcData, body, sessionID);

    let BodyParts = info.difference.BodyParts;
    let BodyPartKeys = Object.keys(BodyParts);
    const pmcHealth = pmcData.Health;
    let healthInfo = { IsAlive: true, Health: {} };
    for (let key of BodyPartKeys) {
      let bodyPart = info.difference.BodyParts[key];
      healthInfo.Health[key] = {};
      healthInfo.Health[key].Current = Math.round(pmcHealth.BodyParts[key].Health.Current + bodyPart.Health);

      if ("Effects" in bodyPart && bodyPart.Effects != undefined && bodyPart.Effects != null) {
        healthInfo.Health[key].Effects = bodyPart.Effects;
      }
    }

    healthInfo.Energy = pmcHealth.Energy.Current + info.difference.Energy;
    healthInfo.Hydration = pmcHealth.Hydration.Current + info.difference.Hydration;

    health_f.handler.saveHealth(pmcData, healthInfo, sessionID);
    return item_f.handler.getOutput(sessionID);
  }

  addEffect(pmcData, sessionID, info) {
    let pmcHealth = pmcData.Health;
    let bodyPart = pmcHealth.BodyParts[info.bodyPart];

    if (bodyPart.Effects == undefined) {
      bodyPart.Effects = {};
    }

    switch (info.effectType) {
      case "BreakPart":
        bodyPart.Effects.BreakPart = { Time: -1 };
        break;
    }

    // delete empty property to prevent client bugs
    if (this.isEmpty(bodyPart.Effects)) delete bodyPart.Effects;
  }

  removeEffect(pmcData, sessionID, info) {
    const pmcHealth = pmcData.Health;
    let bodyPart = pmcHealth.BodyParts[info.bodyPart];
    if (!bodyPart.hasOwnProperty("Effects")) {
      return;
    }

    switch (info.effectType) {
      case "BreakPart":
        if (bodyPart.Effects.hasOwnProperty("BreakPart")) {
          delete bodyPart.Effects.BreakPart;
        }
    }

    // delete empty property to prevent client bugs
    if (this.isEmpty(bodyPart.Effects)) delete bodyPart.Effects;
  }

  /* apply the health changes to the profile */
  applyHealth(pmcData, sessionID) {

    const pmcHealth = pmcData.Health;
    let bodyParts = pmcHealth.BodyParts;
    let nodeHealth = this.healths[sessionID];
    let keys = Object.keys(nodeHealth);

    for (let item of keys) {
      if (item !== "Hydration" && item !== "Energy") {
        /* set body part health */
        if(bodyParts[item] !== undefined) {
          bodyParts[item].Health.Current =
            nodeHealth[item] <= 0 ? ~~ (bodyParts[item].Health.Maximum * 0.1) : nodeHealth[item];
        }
      } else {
        /* set resources */
        pmcHealth[item].Current = nodeHealth[item];

        if (pmcHealth[item].Current > pmcHealth[item].Maximum) {
          pmcHealth[item].Current = pmcHealth[item].Maximum;
        }
      }
    }

    let nodeEffects = this.effects[sessionID];
    Object.keys(nodeEffects).forEach((bodyPart) => {
      // clear effects
      delete bodyParts[bodyPart].Effects;

      // add new
      Object.keys(nodeEffects[bodyPart]).forEach((effect) => {
        switch (effect) {
          case "BreakPart":
            this.addEffect(pmcData, sessionID, { bodyPart: bodyPart, effectType: "BreakPart" });
            break;
        }
      });
    });

    pmcHealth.UpdateTime = Math.round(Date.now() / 1000);

    this.initializeHealth(sessionID);
  }

  isEmpty(map) {
    for (var key in map) {
      if (map.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }
}

module.exports.handler = new HealthServer();