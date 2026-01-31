// ═══════════════════════════════════════════════════════════════
// DONNÉES GÉNÉALOGIQUES - Famille Aly Koïra
// ═══════════════════════════════════════════════════════════════

const D={
// GÉNÉRATION 1
"alkamahamane":{id:"alkamahamane",n:"Alkamahamane Sabalkaidi",a:null,g:"M",gen:1,f:null,m:null,sp:["lalla_hamatou"],c:["goussoumbi","goma","hounaye","soumboulou","farimata_alk","ali"]},

// GÉNÉRATION 2
"goussoumbi":{id:"goussoumbi",n:"Goussoumbi Alkamahamane",a:null,g:"M",gen:2,f:"alkamahamane",m:"lalla_hamatou",sp:["Aissa Mahamane Hamatou"],c:["alphary_g","garba_g","klimazou"]},
"goma":{id:"goma",n:"Goma Alkamahamane",a:null,g:"M",gen:2,f:"alkamahamane",m:"lalla_hamatou",c:["sidiki_g"]},
"hounaye":{id:"hounaye",n:"Hounaye (Hounna) Alkamahamane",a:null,g:"M",gen:2,f:"alkamahamane",m:"lalla_hamatou",sp:["Ibannia Albichir"],c:["hallachi_h","aissa_h","tayda_h"]},
"soumboulou":{id:"soumboulou",n:"Soumboulou Alkamahamane",a:null,g:"F",gen:2,f:"alkamahamane",m:"lalla_hamatou",sp:["Alphaga Labassou Saye"],c:["kohondo","sagayo","tassaye"]},
"farimata_alk":{id:"farimata_alk",n:"Farimata Alkamahamane",a:null,g:"F",gen:2,f:"alkamahamane",m:"lalla_hamatou",c:["dalla"]},
"ali":{id:"ali",n:"Ali Alkamahamane",a:"Aly Koïra",g:"M",gen:2,f:"alkamahamane",m:"lalla_hamatou",sp:["Waykounga Samba","Farimata Alassane","Fouga Alassane Hamatou"],c:["mahamane","babachigaw","kobbo","moussa","omorou","tamimoune","mahadi"]},

// GÉNÉRATION 3
// Enfants de Goussoumbi
"alphary_g":{id:"alphary_g",n:"Alphary Goussoumbi",a:null,g:"M",gen:3,f:"goussoumbi",m:"Aissa Mahamane Hamatou",sp:["Tamimoune Ali"],c:["chiddaye","mata_a","ichata_a","boudjal","saleymatou"]},
"garba_g":{id:"garba_g",n:"Garba Goussoumbi",a:null,g:"F",gen:3,f:"goussoumbi",m:"Aissa Mahamane Hamatou",sp:["Alhady"],c:["hamadahamane_al","albakaya_al","yahiya_al","ndolly_al","hajarata_al"]},
"klimazou":{id:"klimazou",n:"Klimazou Goussoumbi",a:null,g:"M",gen:3,f:"goussoumbi",m:"Aissa Mahamane Hamatou",c:["mahamadou_k"]},
// Enfants de Goma
"sidiki_g":{id:"sidiki_g",n:"Sidiki Goma",a:null,g:"M",gen:3,f:"goma",m:null,c:[]},
// Enfants de Hounaye
"hallachi_h":{id:"hallachi_h",n:"Hallachi Hounna",a:null,g:"M",gen:3,f:"hounaye",m:"Ibannia Albichir",c:[]},
"aissa_h":{id:"aissa_h",n:"Aissa Hounna",a:null,g:"F",gen:3,f:"hounaye",m:"Ibannia Albichir",c:[]},
"tayda_h":{id:"tayda_h",n:"Tayda Hounna",a:null,g:"M",gen:3,f:"hounaye",m:"Ibannia Albichir",c:[]},
// Enfants de Soumboulou
"kohondo":{id:"kohondo",n:"Kohondo Alphaga Labassou Saye",a:null,g:"F",gen:3,f:null,m:"soumboulou",c:[]},
"sagayo":{id:"sagayo",n:"Sagayo Alphaga Labassou Saye",a:null,g:"M",gen:3,f:null,m:"soumboulou",c:[]},
"tassaye":{id:"tassaye",n:"Tassaye Alphaga Labassou Saye",a:null,g:"F",gen:3,f:null,m:"soumboulou",c:[]},

// Petits-enfants de Goussoumbi (Génération 4)
// Enfants de Garba Goussoumbi (père: Alhady)
"hamadahamane_al":{id:"hamadahamane_al",n:"Hamadahamane Alhady",a:"Larbou",g:"M",gen:4,f:null,m:"garba_g",c:[]},
"albakaya_al":{id:"albakaya_al",n:"Albakaya Alhady",a:null,g:"M",gen:4,f:null,m:"garba_g",c:[]},
"yahiya_al":{id:"yahiya_al",n:"Yahiya Alhady",a:null,g:"M",gen:4,f:null,m:"garba_g",c:[]},
"ndolly_al":{id:"ndolly_al",n:"N'dolly Alhady",a:null,g:"M",gen:4,f:null,m:"garba_g",c:[]},
"hajarata_al":{id:"hajarata_al",n:"Hajarata Alhady",a:"Haji",g:"F",gen:4,f:null,m:"garba_g",c:[]},
// Enfant de Kimazou Goussoumbi
"mahamadou_k":{id:"mahamadou_k",n:"Mahamadou Klimazou",a:null,g:"M",gen:4,f:"klimazou",m:null,c:[]},

// Enfants de Ali Alkamahamane
"mahamane":{id:"mahamane",n:"Mahamane Ali",a:null,g:"M",gen:3,f:"ali",m:"Waykounga Samba",sp:["Aïcha Houneye","Adijatou Hamma (Hadizatou)","Aïcha Hamma"],c:["mohomone","taya","ahmadou","yata","issouf","halilou","alhalil","aliou_m","houzaye","alassane_s","agaicha_m","abdou_d"]},
"babachigaw":{id:"babachigaw",n:"Babachigaw Ali",a:null,g:"M",gen:3,f:"ali",m:"Farimata Alassane",sp:["Halimatou Mohomodou"],c:["aliou_b","aboubacar","ousmane_a","alhousseini","abdoulaye_s","nouhoum","mata_b"]},
"kobbo":{id:"kobbo",n:"Agacha Ali",a:"Kobbo",g:"F",gen:3,f:"ali",m:"Fouga Alassane",sp:["Fedja Zongo","Mouhammadou Gagay","Taïda Houneï"],c:["aicha_f","arhamatou_f","issa_m","taya_m","izeboncana","jaouja","dally"]},
"moussa":{id:"moussa",n:"Moussa Ali",a:null,g:"M",gen:3,f:"ali",m:"Fouga Alassane",sp:["Habïlatou Mama"],c:["mata_m","haylloli","wanaissou_m","jato","alassane_m","assoumane_m","abdou_m","sala"]},
"omorou":{id:"omorou",n:"Omorou Ali",a:null,g:"M",gen:3,f:"ali",m:"Fouga Alassane",sp:["Cheffou Aliou"],c:["houssouba","kabongou","mahamadou_o","sourgou","tabbo_o","zabbo","ichata_o"]},
"tamimoune":{id:"tamimoune",n:"Tamimoune Ali",a:null,g:"F",gen:3,f:"ali",m:"Fouga Alassane",sp:["Alphary Goussoumbi"],c:["chiddaye","mata_a","ichata_a","boudjal","saleymatou"]},
"mahadi":{id:"mahadi",n:"Mahadi Ali",a:null,g:"M",gen:3,f:"ali",m:"Fouga Alassane",sp:["Aldjannatou Ahmadou"],c:["dayo","saffia","sawde","zarha","aminta_m","chaffa","seydou_m"]},
"dalla":{id:"dalla",n:"Dalla",a:null,g:"M",gen:3,f:null,m:"farimata_alk",c:[]},

// GÉNÉRATION 4 - Enfants de Mahamane
"mohomone":{id:"mohomone",n:"Mohomone Mahamane",a:"Galla",g:"M",gen:4,f:"mahamane",m:"Aïcha Houneye",sp:["(épouse inconnue)"],c:["ibrahim_m","seydou_mo","ousmane_m","adama_m","hirinissa"]},
"taya":{id:"taya",n:"Taya Mahamane",a:null,g:"F",gen:4,f:"mahamane",m:"Aïcha Houneye",sp:["Hamadahamane"],c:["halimatou_h","assaliha_h","arboncana","hadaye"]},
"ahmadou":{id:"ahmadou",n:"Ahmadou Mahamane",a:"Agawa",g:"M",gen:4,f:"mahamane",m:"Adijatou Hamma",c:["hallachi","houreitou","aminata_ag"]},
"yata":{id:"yata",n:"Yata Mahamane",a:null,g:"F",gen:4,f:"mahamane",m:"Adijatou Hamma",sp:["Assabi"],c:["momo","adama_a","hounaijata","waykouti","daoulata","mouna_a","zeinaba"]},
"issouf":{id:"issouf",n:"Issouf Mahamane",a:"Tabbo",g:"M",gen:4,f:"mahamane",m:"Adijatou Hamma",sp:["Haoua Assaliha","Nafissatou Achekou","Saffia Mahadi"],c:["moulaye","adijatou_t","annoussourou","alassane_t","arhamatou_t","assaliha_t","yahiya_t"]},
"halilou":{id:"halilou",n:"Ibrahim Mahamane",a:"Halilou",g:"M",gen:4,f:"mahamane",m:"Aïcha Hamma",sp:["Yolli Hamadalamine"],c:["hamma","idrissa_h","mariam_h","aichata_h"]},
"alhalil":{id:"alhalil",n:"Alhalil Mahamane",a:null,g:"M",gen:4,f:"mahamane",m:"Aïcha Hamma",c:[]},
"aliou_m":{id:"aliou_m",n:"Aliou Mahamane",a:null,g:"M",gen:4,f:"mahamane",m:"Aïcha Hamma",c:[]},
"houzaye":{id:"houzaye",n:"Houzaye Mahamane",a:null,g:"M",gen:4,f:"mahamane",m:"Aïcha Hamma",c:["moussa_hz","daouda_hz","aliou_hz","aramtou_hz","fatoumatou_hz","mariam_hz"]},
"alassane_s":{id:"alassane_s",n:"Alassane Mahamane",a:"Sosso",g:"M",gen:4,f:"mahamane",m:"Aïcha Hamma",sp:["Aminta N'Goiba Kabongou"],c:["alhabibou","alkassoume","ibrahim_a","abdourhamane_a","moussa_a","mariama_a","safietou_a","hamsatou","arhamatou_a","hawa_a","bintou","aichata_a"]},
"agaicha_m":{id:"agaicha_m",n:"Agaichatou Mahamane",a:null,g:"F",gen:4,f:"mahamane",m:"Aïcha Hamma",sp:["Tallo"],c:["hamani_t","salama_t"]},
"abdou_d":{id:"abdou_d",n:"Abdou Mahamane",a:"Doudou",g:"M",gen:4,f:"mahamane",m:"Aïcha Hamma",sp:["Bacha Tabbo","Arhama Ibrahim"],c:["ichata_d","saley_d","hanchata","zaouzata","sarata","akilou","moukaila","daouda","sadou_d","idrissa_d"]},

// GÉNÉRATION 4 - Enfants de Babachigaw
"aliou_b":{id:"aliou_b",n:"Aliou Babachigaw",a:null,g:"M",gen:4,f:"babachigaw",m:"Halimatou Mohomodou",sp:["Halimatou Hamadahamane","Salama Amiro"],c:["mohomodou_ab","idrissa_ab","issoufi_ab","abdoulaye_ab"]},
"aboubacar":{id:"aboubacar",n:"Aboubacar Babachigaw",a:"Diamma",g:"M",gen:4,f:"babachigaw",m:"Halimatou Mohomodou",c:["abdourhamane_di","aminata_di"]},
"ousmane_a":{id:"ousmane_a",n:"Ousmane Babachigaw",a:"Achidago",g:"M",gen:4,f:"babachigaw",m:"Halimatou Mohomodou",c:["harouna","hamadahamane_ou","alassane_ou","nouhou_ou"]},
"alhousseini":{id:"alhousseini",n:"Alhousseini Babachigaw",a:"Aggada",g:"M",gen:4,f:"babachigaw",m:"Halimatou Mohomodou",sp:["Mata Alphary (Tamimoune)"],c:["hakimoune","hamida","houna","zabbo_ag"]},
"abdoulaye_s":{id:"abdoulaye_s",n:"Abdoulaye Babachigaw",a:"Sagara",g:"M",gen:4,f:"babachigaw",m:"Halimatou Mohomodou",c:[]},
"nouhoum":{id:"nouhoum",n:"Nouhou Babachigaw",a:null,g:"M",gen:4,f:"babachigaw",m:"Halimatou Mohomodou",c:["issiaka_no","abdourhamane_no"]},
"mata_b":{id:"mata_b",n:"Mata Babachigaw",a:null,g:"F",gen:4,f:"babachigaw",m:"Halimatou Mohomodou",c:[]},

// GÉNÉRATION 4 - Enfants de Moussa
"mata_m":{id:"mata_m",n:"Mata Moussa",a:null,g:"F",gen:4,f:"moussa",m:"Habïlatou Mama",c:[]},
"haylloli":{id:"haylloli",n:"Haylloli Moussa",a:null,g:"F",gen:4,f:"moussa",m:"Habïlatou Mama",c:[]},
"wanaissou_m":{id:"wanaissou_m",n:"Wanaissou Moussa",a:null,g:"M",gen:4,f:"moussa",m:"Habïlatou Mama",c:[]},
"jato":{id:"jato",n:"Jato Moussa",a:null,g:"F",gen:4,f:"moussa",m:"Habïlatou Mama",c:[]},
"alassane_m":{id:"alassane_m",n:"Alassane Moussa",a:null,g:"M",gen:4,f:"moussa",m:"Habïlatou Mama",c:[]},
"assoumane_m":{id:"assoumane_m",n:"Assoumane Moussa",a:null,g:"M",gen:4,f:"moussa",m:"Habïlatou Mama",c:[]},
"abdou_m":{id:"abdou_m",n:"Abdou Moussa",a:"Boudou",g:"M",gen:4,f:"moussa",m:"Habïlatou Mama",c:[]},
"sala":{id:"sala",n:"Sala Moussa",a:null,g:"M",gen:4,f:"moussa",m:"Habïlatou Mama",c:[]},

// GÉNÉRATION 4 - Enfants d'Omorou
"houssouba":{id:"houssouba",n:"Houssouba Omorou",a:null,g:"M",gen:4,f:"omorou",m:"Cheffou Aliou",c:[]},
"kabongou":{id:"kabongou",n:"Kabongou Omorou",a:null,g:"M",gen:4,f:"omorou",m:"Cheffou Aliou",c:["wayo","aminta_k","makiou","yacouba","ngolo","issiaka"]},
"mahamadou_o":{id:"mahamadou_o",n:"Mahamadou Omorou",a:null,g:"M",gen:4,f:"omorou",m:"Cheffou Aliou",sp:["Izéboncana Bangando"],c:["zeinabou","koddo_m","bouba_m"]},
"sourgou":{id:"sourgou",n:"Ibrahim Omorou",a:"Sourgou",g:"M",gen:4,f:"omorou",m:"Cheffou Aliou",c:["adija_s","mariama_s","fatoumata_s","ammou","bouba_s","koddo_s"]},
"tabbo_o":{id:"tabbo_o",n:"Tabbo Omorou",a:"Abdoulaye",g:"M",gen:4,f:"omorou",m:"Cheffou Aliou",sp:["Saffia Mahadi"],c:["almahamoudou","minkailou","bacha","moumoumini","gallou","soumma","sadou_t"]},
"zabbo":{id:"zabbo",n:"Zabbo Omorou",a:null,g:"F",gen:4,f:"omorou",m:"Cheffou Aliou",c:[]},
"ichata_o":{id:"ichata_o",n:"Ichata Omorou",a:null,g:"F",gen:4,f:"omorou",m:"Cheffou Aliou",c:["alhoussouna","hachimine","hallachi","houreita_a","mariama_dj","haoua_dj","aminta_dj","haja"]},

// GÉNÉRATION 4 - Enfants de Tamimoune
"chiddaye":{id:"chiddaye",n:"Chiddaye Alphary",a:null,g:"M",gen:4,f:"alphary_g",m:"tamimoune",sp:["Bintou Mayloule"],c:["djiougou","arhamatou_ch"]},
"mata_a":{id:"mata_a",n:"Mata Alphary",a:null,g:"F",gen:4,f:"alphary_g",m:"tamimoune",sp:["Alhousseini Babachigaw (Aggada)"],c:["hakimoune","hamida","houna","zabbo_ag"]},
"ichata_a":{id:"ichata_a",n:"Ichata Alphary",a:"Aissata",g:"F",gen:4,f:"alphary_g",m:"tamimoune",c:[]},
"boudjal":{id:"boudjal",n:"Boudjal Alphary",a:"Boudia",g:"M",gen:4,f:"alphary_g",m:"tamimoune",c:[]},
"saleymatou":{id:"saleymatou",n:"Saleymatou Alphary",a:null,g:"F",gen:4,f:"alphary_g",m:"tamimoune",sp:["Ario Salo de Zindiga"],c:["salo"]},

// GÉNÉRATION 4 - Enfants de Mahadi
"dayo":{id:"dayo",n:"Dayo Mahadi",a:null,g:"F",gen:4,f:"mahadi",m:"Aldjannatou Ahmadou",c:[]},
"saffia":{id:"saffia",n:"Saffia Mahadi",a:null,g:"F",gen:4,f:"mahadi",m:"Aldjannatou Ahmadou",c:[]},
"sawde":{id:"sawde",n:"Sawde Mahadi",a:null,g:"F",gen:4,f:"mahadi",m:"Aldjannatou Ahmadou",c:[]},
"zarha":{id:"zarha",n:"Zarha Mahadi",a:null,g:"F",gen:4,f:"mahadi",m:"Aldjannatou Ahmadou",c:[]},
"aminta_m":{id:"aminta_m",n:"Aminta Mahadi",a:null,g:"F",gen:4,f:"mahadi",m:"Aldjannatou Ahmadou",c:[]},
"chaffa":{id:"chaffa",n:"Chaffa Mahadi",a:null,g:"M",gen:4,f:"mahadi",m:"Aldjannatou Ahmadou",c:[]},
"seydou_m":{id:"seydou_m",n:"Seydou Mahadi",a:null,g:"M",gen:4,f:"mahadi",m:"Aldjannatou Ahmadou",c:["babeye","abaneye","adija_se","chidi","arhamatou_se","mariama_se","ali_se","bibata","abdoulaye_se","saleye"]},

// GÉNÉRATION 4 - Enfants de Kobbo
"aicha_f":{id:"aicha_f",n:"Aicha Fedja",a:null,g:"F",gen:4,f:"fedja_zongo",m:"kobbo",c:["safietou_h","farimata_h","mohomodou_h","haoua_h","adama_h"]},
"arhamatou_f":{id:"arhamatou_f",n:"Arhamatou Fedja",a:null,g:"F",gen:4,f:"fedja_zongo",m:"kobbo",c:["fatou_m","maimouna_m","yahiya_m","mommo_m","wanaissou_b"]},
"issa_m":{id:"issa_m",n:"Issa Mohomodou",a:null,g:"M",gen:4,f:"mouhammadou_gagay",m:"kobbo",c:["mohomone_i","haoua_i"]},
"taya_m":{id:"taya_m",n:"Taya Mohomodou",a:null,g:"M",gen:4,f:"mouhammadou_gagay",m:"kobbo",c:["babba","noussoura","kabongou_a"]},
"izeboncana":{id:"izeboncana",n:"Izeboncana Tayda",a:null,g:"F",gen:4,f:"taida_hounei",m:"kobbo",c:["timintika","sawata","zarha_b"]},
"jaouja":{id:"jaouja",n:"Jaouja Tayda",a:null,g:"F",gen:4,f:"taida_hounei",m:"kobbo",c:["chidiya","ichata_ha"]},
"dally":{id:"dally",n:"Dally Tayda",a:null,g:"F",gen:4,f:"taida_hounei",m:"kobbo",c:["arhamatou_d","hancha","idrissa_da","abdoulaye_d","mouna_d","bouba_d","souma","koddo_d"]},

// GÉNÉRATION 5 - Petits-enfants (échantillon avec mères)
"moulaye":{id:"moulaye",n:"Moulaye Tabbo",a:null,g:"M",gen:5,f:"issouf",m:"Haoua Assaliha",c:[]},
"adijatou_t":{id:"adijatou_t",n:"Adijatou Tabbo",a:null,g:"F",gen:5,f:"issouf",m:"Haoua Assaliha",c:[]},
"annoussourou":{id:"annoussourou",n:"Annoussourou Tabbo",a:null,g:"M",gen:5,f:"issouf",m:"Nafissatou Achekou",c:[]},
"alassane_t":{id:"alassane_t",n:"Alassane Tabbo",a:"Boncana",g:"M",gen:5,f:"issouf",m:"Nafissatou Achekou",c:[]},
"arhamatou_t":{id:"arhamatou_t",n:"Arhamatou Tabbo",a:null,g:"F",gen:5,f:"issouf",m:"Nafissatou Achekou",c:[]},
"assaliha_t":{id:"assaliha_t",n:"Assaliha Tabbo",a:null,g:"F",gen:5,f:"issouf",m:"Nafissatou Achekou",c:[]},
"yahiya_t":{id:"yahiya_t",n:"Yahiya Tabbo",a:null,g:"M",gen:5,f:"issouf",m:"Saffia Mahadi",c:[]},
"momo":{id:"momo",n:"Momo Assabi",a:null,g:"M",gen:5,f:null,m:"yata",c:[]},
"adama_a":{id:"adama_a",n:"Adama Assabi",a:null,g:"M",gen:5,f:null,m:"yata",c:[]},
"hounaijata":{id:"hounaijata",n:"Hounaijata Assabi",a:null,g:"F",gen:5,f:null,m:"yata",c:[]},
"waykouti":{id:"waykouti",n:"Waykouti Assabi",a:null,g:"F",gen:5,f:null,m:"yata",c:[]},
"daoulata":{id:"daoulata",n:"Daoulata Assabi",a:null,g:"F",gen:5,f:null,m:"yata",c:[]},
"mouna_a":{id:"mouna_a",n:"Mouna Assabi",a:null,g:"F",gen:5,f:null,m:"yata",c:[]},
"zeinaba":{id:"zeinaba",n:"Zeinaba Assabi",a:null,g:"F",gen:5,f:null,m:"yata",c:[]},
"alhabibou":{id:"alhabibou",n:"Abdoulaye Alassane",a:"Alhabibou",g:"M",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"alkassoume":{id:"alkassoume",n:"Alkassoume Alassane",a:null,g:"M",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"ibrahim_a":{id:"ibrahim_a",n:"Ibrahim Alassane",a:"Bruno",g:"M",gen:5,f:"alassane_s",m:"Aminta N'Goiba",sp:["Leïla Abdourhamane Maiga"],c:["ahmed_salia"]},
"abdourhamane_a":{id:"abdourhamane_a",n:"Abdourhamane Alassane",a:"Doumma",g:"M",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"moussa_a":{id:"moussa_a",n:"Moussa Alassane",a:"Assani",g:"M",gen:5,f:"alassane_s",m:"Aminta N'Goiba",sp:["Lalla Az-Zahra Almoudou Touré","Mariame Boubacar Alassane Wanaysou"],c:["alassane_ma","abdoulaye_ma","ibrahim_ma","abdourahman_ma","hadijatou_ma","zoumouroudatou","arrahmatoulahi","azzahratou","mariame_ma","aminata_ma","alkassoum_ma","mohammed_ma","hamidou_ma"]},
"mariama_a":{id:"mariama_a",n:"Mariama Alassane",a:null,g:"F",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"safietou_a":{id:"safietou_a",n:"Safietou Alassane",a:null,g:"F",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"hamsatou":{id:"hamsatou",n:"Hamsatou Alassane",a:null,g:"F",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"arhamatou_a":{id:"arhamatou_a",n:"Arhamatou Alassane",a:null,g:"F",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"hawa_a":{id:"hawa_a",n:"Hawa Alassane",a:null,g:"F",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"bintou":{id:"bintou",n:"Bintou Alassane",a:null,g:"F",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},
"aichata_a":{id:"aichata_a",n:"Aichata Alassane",a:null,g:"F",gen:5,f:"alassane_s",m:"Aminta N'Goiba",c:[]},

// GÉNÉRATION 6 - Enfants de Moussa Alassane (Assani)
// 1ère épouse : Lalla Az-Zahra Almoudou Touré
"alassane_ma":{id:"alassane_ma",n:"Alassane Moussa Alassane",a:"décédé",g:"M",gen:6,f:"moussa_a",m:"Lalla Az-Zahra Almoudou Touré",c:[]},
"abdoulaye_ma":{id:"abdoulaye_ma",n:"Abdoulaye Alhabib Moussa Alassane",a:null,g:"M",gen:6,f:"moussa_a",m:"Lalla Az-Zahra Almoudou Touré",c:[]},
"ibrahim_ma":{id:"ibrahim_ma",n:"Ibrahim Haliloulahi Moussa Alassane",a:null,g:"M",gen:6,f:"moussa_a",m:"Lalla Az-Zahra Almoudou Touré",c:[]},
"abdourahman_ma":{id:"abdourahman_ma",n:"Abdourahman Moussa Alassane",a:null,g:"M",gen:6,f:"moussa_a",m:"Lalla Az-Zahra Almoudou Touré",c:[]},
"hadijatou_ma":{id:"hadijatou_ma",n:"Hadijatou Moussa Alassane",a:null,g:"F",gen:6,f:"moussa_a",m:"Lalla Az-Zahra Almoudou Touré",c:[]},
"zoumouroudatou":{id:"zoumouroudatou",n:"Zoumouroudatou Moussa Alassane",a:null,g:"F",gen:6,f:"moussa_a",m:"Lalla Az-Zahra Almoudou Touré",c:[]},
"arrahmatoulahi":{id:"arrahmatoulahi",n:"Ar-Rahmatoulahi Moussa Alassane",a:null,g:"F",gen:6,f:"moussa_a",m:"Lalla Az-Zahra Almoudou Touré",c:[]},
"azzahratou":{id:"azzahratou",n:"Az-Zahratou Moussa Alassane",a:null,g:"F",gen:6,f:"moussa_a",m:"Lalla Az-Zahra Almoudou Touré",c:[]},
// 2ème épouse : Mariame Boubacar Alassane Wanaysou
"mariame_ma":{id:"mariame_ma",n:"Mariame Moussa Alassane",a:"décédée",g:"F",gen:6,f:"moussa_a",m:"Mariame Boubacar Alassane Wanaysou",c:[]},
"aminata_ma":{id:"aminata_ma",n:"Aminata Moussa Alassane",a:null,g:"F",gen:6,f:"moussa_a",m:"Mariame Boubacar Alassane Wanaysou",c:[]},
"alkassoum_ma":{id:"alkassoum_ma",n:"Alkassoum Moussa Alassane",a:null,g:"M",gen:6,f:"moussa_a",m:"Mariame Boubacar Alassane Wanaysou",c:[]},
"mohammed_ma":{id:"mohammed_ma",n:"Mohammed Taher Moussa Alassane",a:null,g:"M",gen:6,f:"moussa_a",m:"Mariame Boubacar Alassane Wanaysou",c:[]},
"hamidou_ma":{id:"hamidou_ma",n:"Hamidou Moussa Alassane",a:null,g:"M",gen:6,f:"moussa_a",m:"Mariame Boubacar Alassane Wanaysou",c:[]},
"ibrahim_m":{id:"ibrahim_m",n:"Ibrahim Mohomone",a:null,g:"M",gen:5,f:"mohomone",m:null,c:[]},
"seydou_mo":{id:"seydou_mo",n:"Seydou Mohomone",a:null,g:"M",gen:5,f:"mohomone",m:null,c:[]},
"ousmane_m":{id:"ousmane_m",n:"Ousmane Mohomone",a:null,g:"M",gen:5,f:"mohomone",m:null,c:[]},
"adama_m":{id:"adama_m",n:"Adama Mohomone",a:null,g:"M",gen:5,f:"mohomone",m:null,c:[]},
"hirinissa":{id:"hirinissa",n:"Hirinissa Mohomone",a:"Aichata",g:"F",gen:5,f:"mohomone",m:null,c:[]},
"hamma":{id:"hamma",n:"Hamma Halilou",a:"Ario",g:"M",gen:5,f:"halilou",m:"Yolli Hamadalamine",c:[]},
"idrissa_h":{id:"idrissa_h",n:"Idrissa Halilou",a:null,g:"M",gen:5,f:"halilou",m:"Yolli Hamadalamine",c:[]},
"mariam_h":{id:"mariam_h",n:"Mariam Halilou",a:null,g:"F",gen:5,f:"halilou",m:"Yolli Hamadalamine",c:[]},
"aichata_h":{id:"aichata_h",n:"Aichata Halilou",a:null,g:"F",gen:5,f:"halilou",m:"Yolli Hamadalamine",c:[]},
"halimatou_h":{id:"halimatou_h",n:"Halimatou Hamadahamane",a:"Larbou",g:"F",gen:5,f:null,m:"taya",sp:["Aliou"],c:["aichata_al","fadimata_al","haoua_al","fatoumata_al","hajarta_al","mohomodou_al","idrissa_al"]},
"assaliha_h":{id:"assaliha_h",n:"Assaliha Hamadahamane",a:"Larbou",g:"M",gen:5,f:null,m:"taya",c:["waiyou","lalla_as","adizatou_as","fato_as","ibrahim_as","alassane_as","alousseiny_as"]},
"arboncana":{id:"arboncana",n:"Arboncana Hamadahamane",a:null,g:"M",gen:5,f:null,m:"taya",c:["salamata_ar","fato_ar"]},
"hadaye":{id:"hadaye",n:"Hadaye Hamadahamane",a:null,g:"F",gen:5,f:"taya",m:null,c:[]},
"ichata_d":{id:"ichata_d",n:"Ichata Doudou",a:null,g:"F",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"saley_d":{id:"saley_d",n:"Saley Doudou",a:null,g:"M",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"hanchata":{id:"hanchata",n:"Hanchata Doudou",a:null,g:"F",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"zaouzata":{id:"zaouzata",n:"Zaouzata Doudou",a:null,g:"F",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"sarata":{id:"sarata",n:"Sarata Doudou",a:null,g:"F",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"akilou":{id:"akilou",n:"Akilou Doudou",a:null,g:"M",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"moukaila":{id:"moukaila",n:"Moukaila Doudou",a:null,g:"M",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"daouda":{id:"daouda",n:"Daouda Doudou",a:null,g:"M",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"sadou_d":{id:"sadou_d",n:"Sadou Doudou",a:null,g:"M",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"idrissa_d":{id:"idrissa_d",n:"Idrissa Doudou",a:null,g:"M",gen:5,f:"abdou_d",m:"Bacha Tabbo",c:[]},
"wayo":{id:"wayo",n:"Wayo Kabongou",a:"N'goyba",g:"M",gen:5,f:"kabongou",m:null,c:[]},
"aminta_k":{id:"aminta_k",n:"Aminta Kabongou",a:"N'goyba",g:"F",gen:5,f:"kabongou",m:null,c:[]},
"makiou":{id:"makiou",n:"Makiou Kabongou",a:"N'goyba",g:"M",gen:5,f:"kabongou",m:null,c:[]},
"yacouba":{id:"yacouba",n:"Yacouba Kabongou",a:"N'goyba",g:"M",gen:5,f:"kabongou",m:null,c:[]},
"ngolo":{id:"ngolo",n:"N'Golo Kabongou",a:"N'goyba",g:"M",gen:5,f:"kabongou",m:null,c:[]},
"issiaka":{id:"issiaka",n:"Issiaka Kabongou",a:"N'goyba",g:"M",gen:5,f:"kabongou",m:null,c:[]},
"zeinabou":{id:"zeinabou",n:"Zeinabou Mahamadou",a:null,g:"F",gen:5,f:"mahamadou_o",m:"Izéboncana Bangando",c:[]},
"koddo_m":{id:"koddo_m",n:"Koddo Mahamadou",a:null,g:"F",gen:5,f:"mahamadou_o",m:"Izéboncana Bangando",c:[]},
"bouba_m":{id:"bouba_m",n:"Bouba Mahamadou",a:null,g:"M",gen:5,f:"mahamadou_o",m:"Izéboncana Bangando",c:[]},
"adija_s":{id:"adija_s",n:"Adija Sourgou",a:null,g:"F",gen:5,f:"sourgou",m:"Ibania Seydou",c:[]},
"mariama_s":{id:"mariama_s",n:"Mariama Sourgou",a:null,g:"F",gen:5,f:"sourgou",m:"Ibania Seydou",c:[]},
"fatoumata_s":{id:"fatoumata_s",n:"Fatoumata Sourgou",a:null,g:"F",gen:5,f:"sourgou",m:"Ibania Seydou",c:[]},
"ammou":{id:"ammou",n:"Ammou Sourgou",a:null,g:"F",gen:5,f:"sourgou",m:"(à définir)",c:[]},
"bouba_s":{id:"bouba_s",n:"Bouba Sourgou",a:null,g:"M",gen:5,f:"sourgou",m:"(à définir)",c:[]},
"koddo_s":{id:"koddo_s",n:"Aichata Sourgou",a:"Koddo",g:"F",gen:5,f:"sourgou",m:"(à définir)",c:[]},
"almahamoudou":{id:"almahamoudou",n:"Almahamoudou Tabagore",a:"Illile",g:"M",gen:5,f:"tabbo_o",m:"Saffia Mahadi",c:[]},
"minkailou":{id:"minkailou",n:"Minkailou Tabagore",a:"Kila",g:"M",gen:5,f:"tabbo_o",m:"Saffia Mahadi",c:[]},
"bacha":{id:"bacha",n:"Bacha Tabagore",a:null,g:"M",gen:5,f:"tabbo_o",m:"Saffia Mahadi",c:[]},
"moumoumini":{id:"moumoumini",n:"Moumoumini Tabagore",a:"Belleythiero",g:"M",gen:5,f:"tabbo_o",m:"Saffia Mahadi",c:[]},
"gallou":{id:"gallou",n:"Gallou Tabagore",a:null,g:"M",gen:5,f:"tabbo_o",m:"Saffia Mahadi",c:[]},
"soumma":{id:"soumma",n:"Soumma Tabagore",a:null,g:"M",gen:5,f:"tabbo_o",m:"Saffia Mahadi",c:[]},
"sadou_t":{id:"sadou_t",n:"Sadou Tabagore",a:null,g:"M",gen:5,f:"tabbo_o",m:"Saffia Mahadi",c:[]},
"alhoussouna":{id:"alhoussouna",n:"Alhoussouna Bodowal",a:null,g:"M",gen:5,f:null,m:"ichata_o",c:[]},
"hachimine":{id:"hachimine",n:"Hachimine Bodowal",a:null,g:"M",gen:5,f:null,m:"ichata_o",c:[]},
"hallachi":{id:"hallachi",n:"Hallachi Agawa",a:null,g:"M",gen:5,f:null,m:"ichata_o",c:[]},
"houreita_a":{id:"houreita_a",n:"Houreita Agawa",a:null,g:"F",gen:5,f:null,m:"ichata_o",c:[]},
"mariama_dj":{id:"mariama_dj",n:"Mariama Djama",a:null,g:"F",gen:5,f:null,m:"ichata_o",c:[]},
"haoua_dj":{id:"haoua_dj",n:"Haoua Djama",a:null,g:"F",gen:5,f:null,m:"ichata_o",c:[]},
"aminta_dj":{id:"aminta_dj",n:"Aminta Djama",a:null,g:"F",gen:5,f:null,m:"ichata_o",c:[]},
"haja":{id:"haja",n:"Haja Galleye",a:null,g:"F",gen:5,f:null,m:"ichata_o",c:[]},
"babeye":{id:"babeye",n:"Babeye Seydou",a:null,g:"M",gen:5,f:"seydou_m",m:null,c:[]},
"abaneye":{id:"abaneye",n:"Abaneye Seydou",a:null,g:"M",gen:5,f:"seydou_m",m:null,c:[]},
"adija_se":{id:"adija_se",n:"Adija Seydou",a:null,g:"F",gen:5,f:"seydou_m",m:null,c:[]},
"chidi":{id:"chidi",n:"Chidi Seydou",a:null,g:"M",gen:5,f:"seydou_m",m:null,c:[]},
"arhamatou_se":{id:"arhamatou_se",n:"Arhamatou Seydou",a:null,g:"F",gen:5,f:"seydou_m",m:null,c:[]},
"mariama_se":{id:"mariama_se",n:"Mariama Seydou",a:null,g:"F",gen:5,f:"seydou_m",m:null,c:[]},
"ali_se":{id:"ali_se",n:"Ali Seydou",a:null,g:"M",gen:5,f:"seydou_m",m:null,c:[]},
"bibata":{id:"bibata",n:"Bibata Seydou",a:null,g:"F",gen:5,f:"seydou_m",m:null,c:[]},
"abdoulaye_se":{id:"abdoulaye_se",n:"Abdoulaye Seydou",a:null,g:"M",gen:5,f:"seydou_m",m:null,c:[]},
"saleye":{id:"saleye",n:"Saleye Seydou",a:null,g:"M",gen:5,f:"seydou_m",m:null,c:[]},
"djiougou":{id:"djiougou",n:"Djiougou Chideye",a:null,g:"M",gen:5,f:"chiddaye",m:"Bintou Mayloule",c:[]},
"arhamatou_ch":{id:"arhamatou_ch",n:"Arhamatou Chideye",a:null,g:"F",gen:5,f:"chiddaye",m:null,c:[]},
"hakimoune":{id:"hakimoune",n:"Hakimoune Aggada",a:null,g:"M",gen:5,f:"alhousseini",m:"mata_a",c:[]},
"hamida":{id:"hamida",n:"Hamida Aggada",a:null,g:"F",gen:5,f:"alhousseini",m:"mata_a",c:[]},
"houna":{id:"houna",n:"Houna Aggada",a:null,g:"F",gen:5,f:"alhousseini",m:"mata_a",c:[]},
"zabbo_ag":{id:"zabbo_ag",n:"Zabbo Aggada",a:null,g:"F",gen:5,f:"alhousseini",m:"mata_a",c:[]},
"salo":{id:"salo",n:"Salo Alkassahi",a:null,g:"M",gen:5,f:null,m:"saleymatou",c:[]},
"safietou_h":{id:"safietou_h",n:"Safietou Hanakoukou",a:null,g:"F",gen:5,f:null,m:"aicha_f",c:[]},
"farimata_h":{id:"farimata_h",n:"Farimata Hanakoukou",a:null,g:"F",gen:5,f:null,m:"aicha_f",c:[]},
"mohomodou_h":{id:"mohomodou_h",n:"Mohomodou Hanakoukou",a:"Mawal",g:"M",gen:5,f:null,m:"aicha_f",c:[]},
"haoua_h":{id:"haoua_h",n:"Haoua Hanakoukou",a:null,g:"F",gen:5,f:null,m:"aicha_f",c:[]},
"adama_h":{id:"adama_h",n:"Adama Hanakoukou",a:null,g:"M",gen:5,f:null,m:"aicha_f",c:[]},
"fatou_m":{id:"fatou_m",n:"Fatou Moussa",a:null,g:"F",gen:5,f:null,m:"arhamatou_f",c:[]},
"maimouna_m":{id:"maimouna_m",n:"Maimouna Moussa",a:null,g:"F",gen:5,f:null,m:"arhamatou_f",c:[]},
"yahiya_m":{id:"yahiya_m",n:"Yahiya Moussa",a:null,g:"M",gen:5,f:null,m:"arhamatou_f",c:[]},
"mommo_m":{id:"mommo_m",n:"Mommo Moussa",a:null,g:"M",gen:5,f:null,m:"arhamatou_f",c:[]},
"wanaissou_b":{id:"wanaissou_b",n:"Wanaissou Moussa Bahadou",a:null,g:"M",gen:5,f:null,m:"arhamatou_f",c:[]},
"babba":{id:"babba",n:"Babba Amiro",a:null,g:"M",gen:5,f:"taya_m",m:null,c:[]},
"noussoura":{id:"noussoura",n:"Noussoura Amiro",a:null,g:"F",gen:5,f:"taya_m",m:null,c:[]},
"kabongou_a":{id:"kabongou_a",n:"Kabongou Amiro",a:null,g:"M",gen:5,f:"taya_m",m:null,c:[]},
"mohomone_i":{id:"mohomone_i",n:"Mohomone Issa",a:null,g:"M",gen:5,f:"issa_m",m:null,c:[]},
"haoua_i":{id:"haoua_i",n:"Haoua Issa",a:"N'gary",g:"F",gen:5,f:"issa_m",m:null,c:[]},
"timintika":{id:"timintika",n:"Timintika Bodowal",a:null,g:"F",gen:5,f:null,m:"izeboncana",c:[]},
"sawata":{id:"sawata",n:"Sawata Bodowal",a:null,g:"F",gen:5,f:null,m:"izeboncana",c:[]},
"zarha_b":{id:"zarha_b",n:"Zarha Bodowal",a:null,g:"F",gen:5,f:null,m:"izeboncana",c:[]},
"chidiya":{id:"chidiya",n:"Chidiya Halimine",a:null,g:"F",gen:5,f:null,m:"jaouja",c:[]},
"ichata_ha":{id:"ichata_ha",n:"Ichata Halimine",a:null,g:"F",gen:5,f:null,m:"jaouja",c:[]},
"arhamatou_d":{id:"arhamatou_d",n:"Arhamatou Dally",a:null,g:"F",gen:5,f:null,m:"dally",c:[]},
"hancha":{id:"hancha",n:"Hancha Dally",a:null,g:"F",gen:5,f:null,m:"dally",c:[]},
"idrissa_da":{id:"idrissa_da",n:"Idrissa Dally",a:null,g:"M",gen:5,f:null,m:"dally",c:[]},
"abdoulaye_d":{id:"abdoulaye_d",n:"Abdoulaye Dally",a:null,g:"M",gen:5,f:null,m:"dally",c:[]},
"mouna_d":{id:"mouna_d",n:"Mouna Dally",a:null,g:"F",gen:5,f:null,m:"dally",c:[]},
"bouba_d":{id:"bouba_d",n:"Bouba Dally",a:null,g:"M",gen:5,f:null,m:"dally",c:[]},
"souma":{id:"souma",n:"Souma Dally",a:null,g:"F",gen:5,f:null,m:"dally",c:[]},
"koddo_d":{id:"koddo_d",n:"Koddo Dally",a:null,g:"F",gen:5,f:null,m:"dally",c:[]},

// GÉNÉRATION 6 - Arrière-petits-enfants
// Enfants d'Ibrahim Alassane (Bruno)
"ahmed_salia":{id:"ahmed_salia",n:"Ahmed Salia Toure",a:null,g:"M",gen:6,f:"ibrahim_a",m:"Leïla Abdourhamane Maiga",sp:["Kadidia Djibo Diango"],c:["amadou_yusuf"]},

// GÉNÉRATION 7
// Enfant d'Ahmed Salia
"amadou_yusuf":{id:"amadou_yusuf",n:"Amadou-Yûsuf Toure",a:null,g:"M",gen:7,f:"ahmed_salia",m:"Kadidia Djibo Diango",c:[]},

// ═══════════════════════════════════════════════════════════════
// FAMILLE ÉLARGIE - Branche MAHAMANE HAMATOU (beau-frère d'Alkamahamane)
// Mahamane Hamatou est le frère de Lalla Hamatou (épouse d'Alkamahamane)
// ═══════════════════════════════════════════════════════════════

// ANCÊTRE COMMUN - Père de Lalla Hamatou et Mahamane Hamatou
"hamatou_lassane":{id:"hamatou_lassane",n:"Hamatou Lassane",a:"Koro",g:"M",gen:0,f:null,m:null,sp:[],c:["lalla_hamatou","mahamane_h"]},

// Enfants de Hamatou Lassane
"lalla_hamatou":{id:"lalla_hamatou",n:"Lalla Hamatou Lassane Koro",a:null,g:"F",gen:1,f:"hamatou_lassane",m:"(à définir)",sp:["alkamahamane"],c:["goussoumbi","goma","hounaye","soumboulou","farimata_alk","ali"]},

"mahamane_h":{id:"mahamane_h",n:"Mahamane Hamatou Lashane Almansour",a:"Koro Souafou Jaouder boun Zarkoum",g:"M",gen:1,f:"hamatou_lassane",m:"(à définir)",sp:["Farimata Aliou Gourmanthia"],c:["alkaido","alamiro","assoura","aliou_mh","abouchamataye","aicha_mh","gombo","adiza_mh","aboubaye_mh"]},

// GÉNÉRATION 2 - Enfants de Mahamane Hamatou
"alkaido":{id:"alkaido",n:"Alkaido Mahamane",a:null,g:"M",gen:2,f:"mahamane_h",m:"Farimata Aliou Gourmanthia",sp:["Hawa Alkaidi Bokar"],c:["halimatou_alk","mohomodou_alk","fadimata_alk","bana","hailalle","zahara_alk"]},
"alamiro":{id:"alamiro",n:"Alamiro Mahamane",a:null,g:"M",gen:2,f:"mahamane_h",m:"Farimata Aliou Gourmanthia",c:[]},
"assoura":{id:"assoura",n:"Assoura Mahamane",a:null,g:"M",gen:2,f:"mahamane_h",m:"Farimata Aliou Gourmanthia",c:[]},
"aliou_mh":{id:"aliou_mh",n:"Aliou Mahamane",a:null,g:"M",gen:2,f:"mahamane_h",m:"(à définir)",c:[]},
"abouchamataye":{id:"abouchamataye",n:"Abouchamataye Mahamane",a:null,g:"M",gen:2,f:"mahamane_h",m:"(à définir)",c:[]},
"aicha_mh":{id:"aicha_mh",n:"Aïcha Mahamane",a:null,g:"F",gen:2,f:"mahamane_h",m:"(à définir)",c:[]},
"gombo":{id:"gombo",n:"Gombo Mahamane",a:null,g:"M",gen:2,f:"mahamane_h",m:"Farimata Aliou Gourmanthia",c:[]},
"adiza_mh":{id:"adiza_mh",n:"Adiza Mahamane",a:null,g:"F",gen:2,f:"mahamane_h",m:"(à définir)",c:[]},
"aboubaye_mh":{id:"aboubaye_mh",n:"Aboubaye Mahamane",a:null,g:"M",gen:2,f:"mahamane_h",m:"(à définir)",c:[]},

// GÉNÉRATION 3 - Enfants d'Alkaido Mahamane
"halimatou_alk":{id:"halimatou_alk",n:"Halimatou Alkaido",a:"Goungou",g:"F",gen:3,f:"alkaido",m:"Hawa Alkaidi Bokar",sp:["Aboubaye Kouwal dit Idrissa"],c:["omorou_ab","hamaya","farimata_ab"]},
"mohomodou_alk":{id:"mohomodou_alk",n:"Mohomodou Alkaido",a:null,g:"M",gen:3,f:"alkaido",m:"Hawa Alkaidi Bokar",sp:["Fatoumata Molla Kader"],c:["halimatou_moh","alkalifa","ichata_moh","tabati","djinna","abacar_moh"]},
"fadimata_alk":{id:"fadimata_alk",n:"Fadimata Alkaido",a:null,g:"F",gen:3,f:"alkaido",m:"Hawa Alkaidi Bokar",sp:["Moyadji Alkaidi Mohouta Bacha"],c:["kabongou_moy","boubaye_moy","alhassane_moy","agacha_moy"]},
"bana":{id:"bana",n:"Bana Alkaido",a:null,g:"F",gen:3,f:"alkaido",m:"Hawa Alkaidi Bokar",c:["oura"]},
"hailalle":{id:"hailalle",n:"Hailalle Alkaido",a:null,g:"F",gen:3,f:"alkaido",m:"Hawa Alkaidi Bokar",sp:["Chirime Hamane de Bamba"],c:["abdoulaye_ch","abacar_ch","mouazou","fatto","ibrayhawi"]},
"zahara_alk":{id:"zahara_alk",n:"Zahara Alkaido",a:null,g:"F",gen:3,f:"alkaido",m:"Hawa Alkaidi Bokar",c:["abacar_sidi"]},

// GÉNÉRATION 4 - Petits-enfants d'Alkaido via Halimatou (Goungou)
"omorou_ab":{id:"omorou_ab",n:"Omorou Aboubaye",a:null,g:"M",gen:4,f:null,m:"halimatou_alk",c:[]},
"hamaya":{id:"hamaya",n:"Hamaya Aboubaye",a:null,g:"M",gen:4,f:null,m:"halimatou_alk",c:[]},
"farimata_ab":{id:"farimata_ab",n:"Farimata Aboubaye",a:"Falladia",g:"F",gen:4,f:null,m:"halimatou_alk",c:[]},

// GÉNÉRATION 4 - Petits-enfants d'Alkaido via Mohomodou
"halimatou_moh":{id:"halimatou_moh",n:"Halimatou Mohomodou",a:null,g:"F",gen:4,f:"mohomodou_alk",m:"Fatoumata Molla Kader",c:[]},
"alkalifa":{id:"alkalifa",n:"Alkalifa Mohomodou",a:null,g:"M",gen:4,f:"mohomodou_alk",m:"Fatoumata Molla Kader",c:[]},
"ichata_moh":{id:"ichata_moh",n:"Ichata Mohomodou",a:null,g:"F",gen:4,f:"mohomodou_alk",m:"Fatoumata Molla Kader",c:[]},
"tabati":{id:"tabati",n:"Tabati Mohomodou",a:null,g:"F",gen:4,f:"mohomodou_alk",m:"Fatoumata Molla Kader",c:[]},
"djinna":{id:"djinna",n:"Djinna Mohomodou",a:null,g:"F",gen:4,f:"mohomodou_alk",m:"Fatoumata Molla Kader",c:[]},
"abacar_moh":{id:"abacar_moh",n:"Abacar Mohomodou",a:null,g:"M",gen:4,f:"mohomodou_alk",m:"Fatoumata Molla Kader",c:[]},

// GÉNÉRATION 4 - Petits-enfants d'Alkaido via Fadimata
"kabongou_moy":{id:"kabongou_moy",n:"Kabongou Moyadji",a:null,g:"M",gen:4,f:null,m:"fadimata_alk",c:[]},
"boubaye_moy":{id:"boubaye_moy",n:"Boubaye Moyadji",a:null,g:"M",gen:4,f:null,m:"fadimata_alk",c:[]},
"alhassane_moy":{id:"alhassane_moy",n:"Alhassane Moyadji",a:null,g:"M",gen:4,f:null,m:"fadimata_alk",c:[]},
"agacha_moy":{id:"agacha_moy",n:"Agacha Moyadji",a:null,g:"F",gen:4,f:null,m:"fadimata_alk",c:[]},

// GÉNÉRATION 4 - Petit-enfant d'Alkaido via Bana
"oura":{id:"oura",n:"Oura Bana",a:null,g:"F",gen:4,f:null,m:"bana",c:[]},

// GÉNÉRATION 4 - Petits-enfants d'Alkaido via Hailalle
"abdoulaye_ch":{id:"abdoulaye_ch",n:"Abdoulaye Chirime",a:"Mouta",g:"M",gen:4,f:null,m:"hailalle",c:[]},
"abacar_ch":{id:"abacar_ch",n:"Abacar Chirime",a:null,g:"M",gen:4,f:null,m:"hailalle",c:[]},
"mouazou":{id:"mouazou",n:"Mouazou Chirime",a:null,g:"M",gen:4,f:null,m:"hailalle",c:[]},
"fatto":{id:"fatto",n:"Fatto Chirime",a:null,g:"F",gen:4,f:null,m:"hailalle",c:[]},
"ibrayhawi":{id:"ibrayhawi",n:"Ibrayhawi Chirime",a:null,g:"M",gen:4,f:null,m:"hailalle",c:[]},

// GÉNÉRATION 4 - Petit-enfant d'Alkaido via Zahara
"abacar_sidi":{id:"abacar_sidi",n:"Abacar Sidi",a:null,g:"M",gen:4,f:null,m:"zahara_alk",c:[]},

// ═══════════════════════════════════════════════════════════════
// NOUVELLES DONNÉES EXCEL - Janvier 2026
// ═══════════════════════════════════════════════════════════════

// Enfants de Halimatou (Larbou) via Aliou
"aichata_al":{id:"aichata_al",n:"Aichata Aliou",a:"Alido",g:"F",gen:6,f:"Aliou",m:"halimatou_h",c:[]},
"fadimata_al":{id:"fadimata_al",n:"Fadimata Aliou",a:"Fado",g:"F",gen:6,f:"Aliou",m:"halimatou_h",c:[]},
"haoua_al":{id:"haoua_al",n:"Haoua Aliou",a:null,g:"F",gen:6,f:"Aliou",m:"halimatou_h",c:[]},
"fatoumata_al":{id:"fatoumata_al",n:"Fatoumata Aliou",a:"Balatou",g:"F",gen:6,f:"Aliou",m:"halimatou_h",c:[]},
"hajarta_al":{id:"hajarta_al",n:"Hajarta Aliou",a:null,g:"F",gen:6,f:"Aliou",m:"halimatou_h",c:[]},
"mohomodou_al":{id:"mohomodou_al",n:"Mohomodou Aliou",a:null,g:"M",gen:6,f:"Aliou",m:"halimatou_h",c:[]},
"idrissa_al":{id:"idrissa_al",n:"Idrissa Aliou",a:null,g:"M",gen:6,f:"Aliou",m:"halimatou_h",c:[]},

// Enfants d'Assaliha (Larbou)
"waiyou":{id:"waiyou",n:"Waiyou Assalia",a:null,g:"M",gen:6,f:"assaliha_h",m:null,c:[]},
"lalla_as":{id:"lalla_as",n:"Lalla Assalia",a:null,g:"F",gen:6,f:"assaliha_h",m:null,c:[]},
"adizatou_as":{id:"adizatou_as",n:"Adizatou Assalia",a:null,g:"F",gen:6,f:"assaliha_h",m:null,c:[]},
"fato_as":{id:"fato_as",n:"Fato Assalia",a:null,g:"F",gen:6,f:"assaliha_h",m:null,c:[]},
"ibrahim_as":{id:"ibrahim_as",n:"Ibrahim Assalia",a:"Hagadoumba",g:"M",gen:6,f:"assaliha_h",m:null,c:[]},
"alassane_as":{id:"alassane_as",n:"Alassane Assalia",a:null,g:"M",gen:6,f:"assaliha_h",m:null,c:[]},
"alousseiny_as":{id:"alousseiny_as",n:"Alousseiny Assalia",a:null,g:"M",gen:6,f:"assaliha_h",m:null,c:[]},

// Enfants d'Arboncana
"salamata_ar":{id:"salamata_ar",n:"Salamata Arboncana",a:"Deybey",g:"F",gen:6,f:"arboncana",m:null,c:[]},
"fato_ar":{id:"fato_ar",n:"Fato Arboncana",a:null,g:"F",gen:6,f:"arboncana",m:null,c:[]},

// Enfants d'Ahmadou (Agawa)
"hallachi":{id:"hallachi",n:"Alassane Ahmadou",a:"Hallachi",g:"M",gen:5,f:"ahmadou",m:null,c:["mohomodou_ha","abdoulkadri","attahir","alassane_ha","houzeye_ha","chitta","abdoulkarim","mohomodou_ha2"]},
"houreitou":{id:"houreitou",n:"Houreitou Ahmadou",a:null,g:"F",gen:5,f:"ahmadou",m:null,c:[]},
"aminata_ag":{id:"aminata_ag",n:"Aminata Ahmadou",a:null,g:"F",gen:5,f:"ahmadou",m:null,c:[]},

// Enfants de Hallachi
"mohomodou_ha":{id:"mohomodou_ha",n:"Mohomodou Alassane",a:"Adama",g:"M",gen:6,f:"hallachi",m:null,c:["moussa_mh","doumma_mh"]},
"abdoulkadri":{id:"abdoulkadri",n:"Abdoulkadri Alassane",a:null,g:"M",gen:6,f:"hallachi",m:null,c:[]},
"attahir":{id:"attahir",n:"Attahir Alassane",a:null,g:"M",gen:6,f:"hallachi",m:null,c:[]},
"alassane_ha":{id:"alassane_ha",n:"Alassane Alassane",a:"Aoudou",g:"M",gen:6,f:"hallachi",m:null,c:["moulaye_ao","ibrahim_ao","mahamane_ao","oumar_ao"]},
"houzeye_ha":{id:"houzeye_ha",n:"Houzeye Alassane",a:null,g:"M",gen:6,f:"hallachi",m:null,c:[]},
"chitta":{id:"chitta",n:"Chitta Alassane",a:null,g:"M",gen:6,f:"hallachi",m:null,c:["ibounia"]},
"abdoulkarim":{id:"abdoulkarim",n:"Abdoulkarim Alassane",a:null,g:"M",gen:6,f:"hallachi",m:null,c:[]},
"mohomodou_ha2":{id:"mohomodou_ha2",n:"Mohomodou Alassane",a:null,g:"M",gen:6,f:"hallachi",m:null,c:[]},

// Petits-enfants de Hallachi
"moussa_mh":{id:"moussa_mh",n:"Moussa Mohomodou",a:null,g:"M",gen:7,f:"mohomodou_ha",m:null,c:[]},
"doumma_mh":{id:"doumma_mh",n:"Doumma Mohomodou",a:null,g:"M",gen:7,f:"mohomodou_ha",m:null,c:[]},
"moulaye_ao":{id:"moulaye_ao",n:"Moulaye Alassane",a:null,g:"M",gen:7,f:"alassane_ha",m:null,c:[]},
"ibrahim_ao":{id:"ibrahim_ao",n:"Ibrahim Alassane",a:null,g:"M",gen:7,f:"alassane_ha",m:null,c:[]},
"mahamane_ao":{id:"mahamane_ao",n:"Mahamane Alassane",a:null,g:"M",gen:7,f:"alassane_ha",m:null,c:[]},
"oumar_ao":{id:"oumar_ao",n:"Oumar Alassane",a:null,g:"M",gen:7,f:"alassane_ha",m:null,c:[]},
"ibounia":{id:"ibounia",n:"Ibounia Chitta",a:null,g:"M",gen:7,f:"chitta",m:null,c:[]},

// Enfants de Houzaye
"moussa_hz":{id:"moussa_hz",n:"Moussa Houzaye",a:null,g:"M",gen:5,f:"houzaye",m:null,c:[]},
"daouda_hz":{id:"daouda_hz",n:"Daouda Houzaye",a:null,g:"M",gen:5,f:"houzaye",m:null,c:["mahamane_dh","moussa_dh","moumini_dh"]},
"aliou_hz":{id:"aliou_hz",n:"Aliou Houzaye",a:null,g:"M",gen:5,f:"houzaye",m:null,c:["houzeye_ah","daouda_ah","moumini_ah"]},
"aramtou_hz":{id:"aramtou_hz",n:"Aramtou Houzaye",a:null,g:"F",gen:5,f:"houzaye",m:null,c:[]},
"fatoumatou_hz":{id:"fatoumatou_hz",n:"Fatoumatou Houzaye",a:null,g:"F",gen:5,f:"houzaye",m:null,c:[]},
"mariam_hz":{id:"mariam_hz",n:"Mariam Houzaye",a:null,g:"F",gen:5,f:"houzaye",m:null,c:[]},

// Petits-enfants de Houzaye via Daouda
"mahamane_dh":{id:"mahamane_dh",n:"Mahamane Daouda",a:null,g:"M",gen:6,f:"daouda_hz",m:null,c:[]},
"moussa_dh":{id:"moussa_dh",n:"Moussa Daouda",a:null,g:"M",gen:6,f:"daouda_hz",m:null,c:[]},
"moumini_dh":{id:"moumini_dh",n:"Moumini Daouda",a:null,g:"M",gen:6,f:"daouda_hz",m:null,c:[]},

// Petits-enfants de Houzaye via Aliou
"houzeye_ah":{id:"houzeye_ah",n:"Houzeye Aliou",a:null,g:"M",gen:6,f:"aliou_hz",m:null,c:[]},
"daouda_ah":{id:"daouda_ah",n:"Daouda Aliou",a:null,g:"M",gen:6,f:"aliou_hz",m:null,c:[]},
"moumini_ah":{id:"moumini_ah",n:"Moumini Aliou",a:null,g:"M",gen:6,f:"aliou_hz",m:null,c:[]},

// Enfants d'Agaichatou
"hamani_t":{id:"hamani_t",n:"Hamani Tallo",a:null,g:"M",gen:5,f:"Tallo",m:"agaicha_m",c:["bossou"]},
"salama_t":{id:"salama_t",n:"Salama Tallo",a:null,g:"F",gen:5,f:"Tallo",m:"agaicha_m",c:[]},
"bossou":{id:"bossou",n:"Bossou Hamani",a:null,g:"M",gen:6,f:"hamani_t",m:null,c:[]},

// Enfants d'Aliou Babachigaw
"mohomodou_ab":{id:"mohomodou_ab",n:"Mohomodou Aliou",a:null,g:"M",gen:5,f:"aliou_b",m:null,c:["abdoulwahab","hamidou_mab","faissal","imrana_mab"]},
"idrissa_ab":{id:"idrissa_ab",n:"Idrissa Aliou",a:null,g:"M",gen:5,f:"aliou_b",m:null,c:["abdoulaye_iab","aboubacar_iab","yehiya_iab","issiaka_iab","issoufi_iab"]},
"issoufi_ab":{id:"issoufi_ab",n:"Issoufi Aliou",a:null,g:"M",gen:5,f:"aliou_b",m:null,c:["yehiya_is","aliou_is"]},
"abdoulaye_ab":{id:"abdoulaye_ab",n:"Abdoulaye Aliou",a:null,g:"M",gen:5,f:"aliou_b",m:null,c:["idrissa_aab"]},

// Petits-enfants d'Aliou B via Mohomodou
"abdoulwahab":{id:"abdoulwahab",n:"Abdoulwahab Mohomodou",a:null,g:"M",gen:6,f:"mohomodou_ab",m:null,c:[]},
"hamidou_mab":{id:"hamidou_mab",n:"Hamidou Mohomodou",a:null,g:"M",gen:6,f:"mohomodou_ab",m:null,c:[]},
"faissal":{id:"faissal",n:"Faissal Mohomodou",a:null,g:"M",gen:6,f:"mohomodou_ab",m:null,c:[]},
"imrana_mab":{id:"imrana_mab",n:"Imrana Mohomodou",a:null,g:"M",gen:6,f:"mohomodou_ab",m:null,c:[]},

// Petits-enfants d'Aliou B via Idrissa
"abdoulaye_iab":{id:"abdoulaye_iab",n:"Abdoulaye Idrissa",a:null,g:"M",gen:6,f:"idrissa_ab",m:null,c:[]},
"aboubacar_iab":{id:"aboubacar_iab",n:"Aboubacar Idrissa",a:null,g:"M",gen:6,f:"idrissa_ab",m:null,c:[]},
"yehiya_iab":{id:"yehiya_iab",n:"Yehiya Idrissa",a:null,g:"M",gen:6,f:"idrissa_ab",m:null,c:[]},
"issiaka_iab":{id:"issiaka_iab",n:"Issiaka Idrissa",a:null,g:"M",gen:6,f:"idrissa_ab",m:null,c:[]},
"issoufi_iab":{id:"issoufi_iab",n:"Issoufi Idrissa",a:null,g:"M",gen:6,f:"idrissa_ab",m:null,c:[]},

// Petits-enfants d'Aliou B via Issoufi
"yehiya_is":{id:"yehiya_is",n:"Yehiya Issoufi",a:null,g:"M",gen:6,f:"issoufi_ab",m:null,c:[]},
"aliou_is":{id:"aliou_is",n:"Aliou Issoufi",a:null,g:"M",gen:6,f:"issoufi_ab",m:null,c:[]},

// Petit-enfant via Abdoulaye
"idrissa_aab":{id:"idrissa_aab",n:"Idrissa Abdoulaye",a:null,g:"M",gen:6,f:"abdoulaye_ab",m:null,c:[]},

// Enfants d'Aboubacar (Diamma)
"abdourhamane_di":{id:"abdourhamane_di",n:"Abdourhamane Aboubacar",a:"Diamma",g:"M",gen:5,f:"aboubacar",m:null,c:[]},
"aminata_di":{id:"aminata_di",n:"Aminata Aboubacar",a:"Diamma",g:"F",gen:5,f:"aboubacar",m:null,c:[]},

// Enfants d'Ousmane (Achidago)
"harouna":{id:"harouna",n:"Harouna Ousmane",a:"Achidago",g:"M",gen:5,f:"ousmane_a",m:null,c:["abdoulback","ibrahim_ha","sadou_ha","mahamoudou_ha","alkassoum_ha"]},
"hamadahamane_ou":{id:"hamadahamane_ou",n:"Hamadahamane Ousmane",a:"Achidago",g:"M",gen:5,f:"ousmane_a",m:null,c:[]},
"alassane_ou":{id:"alassane_ou",n:"Alassane Ousmane",a:"Achidago",g:"M",gen:5,f:"ousmane_a",m:null,c:[]},
"nouhou_ou":{id:"nouhou_ou",n:"Nouhou Ousmane",a:"Achidago",g:"M",gen:5,f:"ousmane_a",m:null,c:[]},

// Petits-enfants d'Ousmane via Harouna
"abdoulback":{id:"abdoulback",n:"Abdoulback Harouna",a:null,g:"M",gen:6,f:"harouna",m:null,c:[]},
"ibrahim_ha":{id:"ibrahim_ha",n:"Ibrahim Harouna",a:null,g:"M",gen:6,f:"harouna",m:null,c:["issoufi_ibh"]},
"sadou_ha":{id:"sadou_ha",n:"Sadou Harouna",a:null,g:"M",gen:6,f:"harouna",m:null,c:[]},
"mahamoudou_ha":{id:"mahamoudou_ha",n:"Mahamoudou Harouna",a:null,g:"M",gen:6,f:"harouna",m:null,c:[]},
"alkassoum_ha":{id:"alkassoum_ha",n:"Alkassoum Harouna",a:null,g:"M",gen:6,f:"harouna",m:null,c:[]},
"issoufi_ibh":{id:"issoufi_ibh",n:"Issoufi Ibrahim",a:null,g:"M",gen:7,f:"ibrahim_ha",m:null,c:[]},

// Enfants de Nouhou Babachigaw
"issiaka_no":{id:"issiaka_no",n:"Issiaka Nouhou",a:null,g:"M",gen:5,f:"nouhoum",m:null,c:["idrissa_is","mafouzou"]},
"abdourhamane_no":{id:"abdourhamane_no",n:"Abdourhamane Nouhou",a:null,g:"M",gen:5,f:"nouhoum",m:null,c:["halidou_ab"]},

// Petits-enfants de Nouhou
"idrissa_is":{id:"idrissa_is",n:"Idrissa Issiaka",a:null,g:"M",gen:6,f:"issiaka_no",m:null,c:[]},
"mafouzou":{id:"mafouzou",n:"Mafouzou Issiaka",a:null,g:"M",gen:6,f:"issiaka_no",m:null,c:[]},
"halidou_ab":{id:"halidou_ab",n:"Halidou Abdourhamane",a:null,g:"M",gen:6,f:"abdourhamane_no",m:null,c:[]}
};