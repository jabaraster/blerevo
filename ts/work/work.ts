const bossIds = [
    "kongou_rikishi",
    "kien_hasami_mushi",
    "kokusyouzoku_zokuchou",
    "yagoruta",
    "kokujuushin",
    "borukorosso",
    "goruraku",
    "kiban",
    "ingenrai",
    "butan",
    "surudoi_kiba",
    "chacha",
    "sinbuu",
    "uta",
    "fiku_kou",
];

bossIds.forEach(bossId => {
    console.log(`.fb-icon-${bossId} {
    .fbIcon("${bossId}");
}`);
});