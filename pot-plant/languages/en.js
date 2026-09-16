window.NCD_POT_PLANT_LANGUAGES =
  window.NCD_POT_PLANT_LANGUAGES || {};

window.NCD_POT_PLANT_LANGUAGES.en = {
  code: "en",
  name: "English",

  interface: {
    playgroundTitle: "NCD Pot Plant Playground",
    playgroundIntro:
      "Ranked semi-transparent wedges with a warm spiral growing beneath them. Scores can be changed with the sliders or supplied through the URL.",

    surveyScores: "Survey scores",
    replaySpiral: "Replay spiral",
    randomResult: "Random result",
    closeScoresTest: "Close scores test",
    balancedResult: "Balanced result",

    maximumFactor: "Maximum factor",
    minimumFactor: "Minimum factor",

    inputOrder: "Input order",

    watchGrow: "Watch it grow",
    watchAgain: "Watch again",

    close: "Close",
    language: "Language"
  },

  /*
    QUALITY CHARACTERISTICS

    "lines" controls exactly what appears on the two concentric
    label circles around the diagram.

    line 1 and line 2 are VISUAL positions, not grammatical
    categories.

    emphasis:true means that line carries the visual emphasis
    (bold/larger type).

    Translators should:
    - use the natural word order of their language;
    - decide which phrase belongs on each concentric circle;
    - emphasise the word or phrase expressing the QUALITY;
    - not imitate English adjective/noun structure if that would
      make the translation unnatural.

    "labelScale" is optional. Leave it at 1 unless a translated
    label needs to be slightly smaller to fit comfortably.
  */

  qcs: {
    LR: {
      lines: [
        { text: "Loving", emphasis: true },
        { text: "Relationships", emphasis: false }
      ],
      labelScale: 1,
      heartQuestion: "Do I really belong here?",
      description:
        "Loving relationships create a community where people experience genuine acceptance, care and belonging."
    },

    EL: {
      lines: [
        { text: "Empowering", emphasis: true },
        { text: "Leadership", emphasis: false }
      ],
      labelScale: 1,
      heartQuestion: "Do you really believe in me?",
      description:
        "Empowering leaders recognise people's God-given potential and help them grow into meaningful responsibility."
    },

    ES: {
      lines: [
        { text: "Effective", emphasis: true },
        { text: "Structures", emphasis: false }
      ],
      labelScale: 1,
      heartQuestion: "Do I really have room to grow?",
      description:
        "Effective structures create the freedom, clarity and support people need to grow and contribute fruitfully."
    },

    GBM: {
      lines: [
        { text: "Gift-based", emphasis: true },
        { text: "Ministry", emphasis: false }
      ],
      labelScale: 1,
      heartQuestion: "Do I really have something to contribute?",
      description:
        "Gift-based ministry helps people discover how God has uniquely equipped them and find meaningful ways to contribute."
    },

    NOE: {
      lines: [
        { text: "Need-oriented", emphasis: true },
        { text: "Evangelism", emphasis: false }
      ],
      labelScale: 1,
      heartQuestion: "Do you really care about me?",
      description:
        "Need-oriented evangelism begins by genuinely seeing and responding to the people God has placed around us."
    },

    IWS: {
      lines: [
        { text: "Inspiring", emphasis: true },
        { text: "Worship Service", emphasis: false }
      ],
      labelScale: 1,
      heartQuestion: "Do I really meet God here?",
      description:
        "Inspiring worship helps people encounter God in ways that renew faith, hope and willingness to respond."
    },

    PS: {
      lines: [
        { text: "Passionate", emphasis: true },
        { text: "Spirituality", emphasis: false }
      ],
      labelScale: 1,
      heartQuestion: "Do I really trust God?",
      description:
        "Passionate spirituality grows where faith is lived from a genuine and life-giving relationship with God."
    },

    HSG: {
      lines: [
        { text: "Holistic", emphasis: true },
        { text: "Small Groups", emphasis: false }
      ],
      labelScale: 1,
      heartQuestion: "Do you really know me?",
      description:
        "Holistic small groups create spaces where people become genuinely known, supported and challenged to grow."
    }
  }
};
