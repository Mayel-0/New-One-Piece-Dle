const POWERUP_EFFECTS = {
  SMOKE_SCREEN: {
    code: "SMOKE_SCREEN",
    type: "timed",
    duration: 2,
    target: "opponent",
    visual: {
      intensity: "10px",
    },
  },
  BLUR_SCREEN: {
    code: "SMOKE_SCREEN",
    type: "timed",
    duration: 2,
    target: "opponent",
    visual: {
      intensity: "10px",
    },
  },
  FREEZE_TURN: {
    code: "FREEZE_TURN",
    type: "timed",
    duration: 1,
    target: "opponent",
  },
  BUSTER_CALL: {
    code: "BUSTER_CALL",
    type: "instant",
    target: "room",
  },
  PHONE_CALL: {
    code: "PHONE_CALL",
    type: "instant",
    target: "self",
  },
  SEE_OPPONENT_GUESS: {
    code: "SEE_OPPONENT_GUESS",
    type: "instant",
    target: "self",
  },
};

module.exports = { POWERUP_EFFECTS };
