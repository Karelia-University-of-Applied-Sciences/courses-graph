const graph = [
    { source: "IC10006", target: "IC10012" }, // Intro to Computing -> Elementary Programming
    { source: "IC10012", target: "IC10013" }, // Elementary -> OOP
    { source: "IC10013", target: "IC10014" }, // OOP -> UI Programming
    { source: "IC10011", target: "IC10007" }, // Digital Tech -> IT Infrastructure

    { source: "KP10017", target: "KP10018" }, // Finnish 1 -> 2
    { source: "KP10018", target: "KP10019" }, // Finnish 2 -> 3
    { source: "KP10018", target: "IC10005" }, // Finnish 2 -> Business Communication Finnish
    { source: "IC10002", target: "IC10052" }, // English -> Professional English
    { source: "IC10052", target: "IC10031" }, // Professional English -> Thesis Writing

    { source: "IC10001", target: "IC10015" }, // Career 1 -> 2
    { source: "IC10015", target: "IC10042" }, // Career 2 -> 3

    { source: "IC10012", target: "IC10018" }, // Elementary -> Data Structures
    { source: "IC10012", target: "IC10022" }, // Elementary -> Web Programming
    { source: "IC10013", target: "IC10022" }, // OOP -> Web Programming
    { source: "IC10013", target: "IC10024" }, // OOP -> Software Engineering 1
    { source: "IC10024", target: "IC10033" }, // Software Eng 1 -> 2
    { source: "IC10022", target: "IC10036" }, // Web -> Frontend
    { source: "IC10022", target: "IC10035" }, // Web -> Backend
    { source: "IC10025", target: "IC10035" }, // API -> Backend
    { source: "IC10034", target: "IC10035" }, // Data Engineering -> Backend
    { source: "IC10035", target: "IC10036" }, // Backend -> Frontend
    { source: "IC10036", target: "IC10037" }, // Frontend -> Mobile Development

    { source: "IC10009", target: "IC10026" }, // Data Management 1 -> 2
    { source: "IC10026", target: "IC10034" }, // Data Management 2 -> Data Engineering

    { source: "IC10007", target: "IC10023" }, // IT Infrastructure -> Applied Networks
    { source: "IC10007", target: "IC10027" }, // IT Infrastructure -> Server Management
    { source: "IC10023", target: "IC10047" }, // Applied Networks -> Networks for Rural Dev

    { source: "IC10013", target: "IC10028" }, // OOP -> IoT Programming
    { source: "IC10028", target: "IC10030" }, // IoT Programming -> IoT and Cloud

    { source: "IC10018", target: "IC10032" }, // Data Structures -> Machine Learning
    { source: "IC10026", target: "IC10032" }, // Data Management 2 -> Machine Learning
    { source: "IC10024", target: "IC10029" }, // Software Eng 1 -> Quality Engineering
    { source: "IC10019", target: "IC10021" }, // Engineering Math -> Discrete Math

    { source: "IC10007", target: "IC10010" }, // IT Infrastructure -> Info Security

    { source: "IC10043", target: "KY10006" }, // R&D Methodologies -> Thesis Planning
    { source: "KY10006", target: "KY10007" }, // Thesis Planning -> Implementation
    { source: "KY10007", target: "KY10008" }, // Thesis Implementation -> Finalising

    { source: "IC10033", target: "IC10038" }, // Software Eng 2 -> Project Work
    { source: "IC10044", target: "KY10006" }, // Practical Training -> Thesis Planning

    { source: "IC10030", target: "IC10039" }, // IoT Cloud -> Smart Regions
    { source: "IC10032", target: "IC10040" }, // ML -> Intelligent Automation
    { source: "IC10024", target: "IC10041" }, // Software Eng 1 -> Business Process Management
];
