export const translations: Record<string, Record<string, string>> = {
  en: {
    nav_login: "Login", nav_about: "About Us", nav_contact: "Contact Us",
    login_sub: "Citizen Information System", login_err: "Incorrect credentials!",
    lbl_user: "Username", lbl_pass: "Password", btn_login: "Secure Login",
    abt_t: "About Rusororo Village", abt_s: "Building a smarter, faster, and more transparent community administration.",
    cnt_t: "Contact Us", cnt_s: "Get in touch with Rusororo Village Administration.",
    sd_dash: "Dashboard", sd_isi: "Isibo Directory", sd_db: "Citizen Database",
    sd_reg: "Register Citizen", sd_inbox: "Admin Inbox", sd_ins: "Health Insurance",
    sd_umu: "Umuganda Tracker", sd_log: "System Log", sd_out: "Log Out",
    sd_trf: "Transfer Citizen", sd_ntc: "Staff Notices", sd_adm: "Manage Admins",
    sd_map: "Geospatial Map", sd_pop: "Population Search",
    app_sub: "Manage operations for Rusororo Cell, Kicukiro District.",
    st_tc: "Total Citizens", st_ti: "Total Isibos", st_au: "Avg. Umuganda", st_hi: "Health Insured",
    ch_gr_t: "Citizen Growth Trend", ch_gr_s: "New registrations over the last 6 months",
    ch_dm_t: "Demographics", ch_dm_s: "Age & Marital Status",
    ch_hs_t: "Housing Distribution", ch_in_t: "Health Insurance Coverage",
    dl_ad: "Adults (18+)", dl_ch: "Children (<18)", dl_ma: "Married", dl_dw: "Divorced/Widowed",
    
    // Tables
    t_nam: "Name", t_nid: "National ID", t_phn: "Phone", t_mar: "Marital Status",
    t_isn: "Isibo", t_typ: "Housing Type", t_ins: "Insurance", t_umu: "Umuganda",
    t_act: "Action", t_dat: "Date", t_eml: "Email", t_msg: "Message",
    t_ldn: "Leader Name", t_ldp: "Leader Phone", t_tct: "Total Citizens", t_sts: "Status",
    t_usr: "Username", t_rol: "Role", t_cat: "Created At", t_tim: "Timestamp", t_dtl: "Details",
    
    // Labels
    lbl_fnam: "First Name", lbl_lnam: "Last Name", lbl_mnam: "Middle Name", lbl_dob: "Date of Birth",
    lbl_nid: "National ID", lbl_phn: "Phone Number", lbl_isn: "Isibo", lbl_typ: "Housing Type",
    lbl_mar: "Marital Status", lbl_rdt: "Registration Date", lbl_dst: "Destination", lbl_rsn: "Reason",
    lbl_fnm: "Full Name", lbl_gen: "Gender", lbl_usr: "Username", lbl_rol: "Role",
    lbl_tit: "Title (e.g. Office Closure)", lbl_msg: "Message content...",
    
    // Statuses & Options
    st_own: "Homeowner", st_ten: "Tenant", st_sin: "Single", st_mar: "Married",
    st_div: "Divorced", st_wid: "Widowed", st_pre: "Present", st_abs: "Absent",
    opt_sel: "Select...", opt_male: "Male", opt_female: "Female",
    opt_adm: "Admin (Standard Access)", opt_vw: "Viewer (Read Only)",
    opt_nrm: "Normal Priority", opt_urg: "Urgent Priority",
    
    // Buttons
    btn_sav: "Save", btn_dl_rp: "Download Report", btn_ad_is: "Add Isibo", btn_cnl: "Cancel",
    btn_sv_at: "Save Attendance", btn_s_al: "Select All", btn_c_al: "Clear All",
    btn_src: "Search", btn_trf: "Transfer", btn_snd: "Send", btn_ad_ad: "Add New Admin",
    btn_cr_ad: "Create Admin", btn_rmv: "Remove Access", btn_cr_nt: "Create Notice",
    btn_pub: "Publish Notice",
    
    // Isibo Directory
    is_t: "Isibo Directory", is_s: "Manage Isibo leaders and assignments",
    is_s_tt: "Total Isibos", is_s_ld: "Total Leaders", is_s_ct: "Total Citizens", is_l_t: "Isibo List",
    
    // Umuganda Tracker
    u_b_t: "Umuganda Tracker", u_b_s: "Track community work attendance",
    u_s_tt: "Total Citizens", u_s_at: "Attended", u_s_ab: "Absent", u_s_rt: "Attendance Rate",
    u_l_t: "Attendance List", u_m_sd: "Select Date",
    
    // Admin Inbox
    inb_t: "Admin Inbox", inb_s: "Manage incoming messages",
    
    // Transfer Citizen
    tr_t: "Transfer Citizen",
    
    // Health Insurance
    ins_t: "Health Insurance", ins_s: "Update insurance provider for citizens",
    i_s_tt: "Total Citizens", i_s_cv: "Covered", i_s_un: "Uninsured", i_s_rt: "Coverage Rate",
    ins_l_t: "Insurance List",
    
    // Registration Form
    reg_t: "Register Citizen", ll_t: "Landlord Details", fam_t: "Family Details",
    fam_sp: "Spouse", fam_ch: "Children",
    
    // Manage Admins
    ma_t: "Admin Management", ma_s: "Add staff and manage access credentials.",
    ma_nc: "New Credentials",
    
    // System Logs
    sl_t: "System Activity Log", sl_nl: "No logs recorded yet.",
    
    // Notices
    nt_t: "Staff Notices", nt_s: "Internal announcements and updates.",
    nt_na: "New Announcement", nt_by: "By", nt_nn: "No notices posted yet.",
    
    // Population Search
    pop_t: "Population Search", pop_s: "Search and filter residents by role and age.",
    lbl_role: "Filter by Role", lbl_age_range: "Age Range",
    opt_child: "Children", opt_husband: "Husband (Parent)", opt_wife: "Wife (Spouse)",
    
    // Phone Ownership
    ph_own: "My Own Number", ph_sp: "Husband / Wife's Number", ph_pa: "Parent's Number", ph_fr: "Friend's Number"
  },
  rw: {
    nav_login: "Kwinjira", nav_about: "Abo Turi Bo", nav_contact: "Twandikire",
    login_sub: "Sisitemu y'Amakuru", login_err: "Izina cyangwa ijambo ry'ibanga sibyo!",
    lbl_user: "Izina", lbl_pass: "Ijambo ry'Ibanga", btn_login: "Kwinjira",
    abt_t: "Kuri Rusororo Village", abt_s: "Gukora ubuyobozi bwihuse.",
    cnt_t: "Twandikire", cnt_s: "Vugana n'ubuyobozi.",
    sd_dash: "Ikibaho", sd_isi: "Amasibo", sd_db: "Abaturage",
    sd_reg: "Kwandika", sd_inbox: "Ubutumwa", sd_ins: "Mituweli",
    sd_umu: "Umuganda", sd_log: "Amateka", sd_out: "Gusohoka",
    sd_trf: "Kwimura Umuturage", sd_ntc: "Amatangazo", sd_adm: "Cunga Abayobozi",
    sd_map: "Ikarita y'Ubutaka", sd_pop: "Shakisha Umuturage",
    app_sub: "Cunga Rusororo Cell.",
    st_tc: "Abaturage Bose", st_ti: "Amasibo Yose", st_au: "Impuzandengo y'Umuganda", st_hi: "Abafite Mituweli",
    ch_gr_t: "Ukwiyongera kw'abaturage", ch_gr_s: "Abaherutse kwiyandikisha mu mezi 6",
    ch_dm_t: "Ibyiciro by'abaturage", ch_dm_s: "Imyaka n'Irangamimerere",
    ch_hs_t: "Uko abaturage batuye", ch_in_t: "Abafite ubwishingizi bw'indwara",
    dl_ad: "Abakuze (18+)", dl_ch: "Abana (<18)", dl_ma: "Abubatse", dl_dw: "Abatandukanye/Abapfakazi",
    
    // Tables
    t_nam: "Amazina", t_nid: "Indangamuntu", t_phn: "Telefone", t_mar: "Irangamimerere",
    t_isn: "Isibo", t_typ: "Imiturire", t_ins: "Ubwishingizi", t_umu: "Umuganda",
    t_act: "Igikorwa", t_dat: "Itariki", t_eml: "Imeli", t_msg: "Ubutumwa",
    t_ldn: "Umuyobozi", t_ldp: "Telefone y'Umuyobozi", t_tct: "Abaturage Bose", t_sts: "Imiterere",
    t_usr: "Izina", t_rol: "Uruhare", t_cat: "Yaremwe", t_tim: "Igihe", t_dtl: "Ibisobanuro",
    
    // Labels
    lbl_fnam: "Izina ry'ikinyarwanda", lbl_lnam: "Izina ry'irikirisitu", lbl_mnam: "Iryagati", lbl_dob: "Itariki y'Amavuko",
    lbl_nid: "Indangamuntu", lbl_phn: "Telefone", lbl_isn: "Isibo", lbl_typ: "Imiturire",
    lbl_mar: "Irangamimerere", lbl_rdt: "Itariki yandikishijweho", lbl_dst: "Aho yimuriwe", lbl_rsn: "Impamvu",
    lbl_fnm: "Amazina Yose", lbl_gen: "Igitsina", lbl_usr: "Izina", lbl_rol: "Uruhare",
    lbl_tit: "Umutwe w'icyo ushaka kuvuga", lbl_msg: "Ubutumwa...",
    
    // Statuses & Options
    st_own: "Nyiri inzu", st_ten: "Umupangayi", st_sin: "Ingaragu", st_mar: "Yubatse",
    st_div: "Batandukanye", st_wid: "Umupfakazi", st_pre: "Yitabiriye", st_abs: "Aba",
    opt_sel: "Hitamo...", opt_male: "Gabo", opt_female: "Gore",
    opt_adm: "Umuyobozi", opt_vw: "Ureba gusa",
    opt_nrm: "Bisanzwe", opt_urg: "Byihutirwa",
    
    // Buttons
    btn_sav: "Bika", btn_dl_rp: "Kura Raporo", btn_ad_is: "Ongeramo Isibo", btn_cnl: "Reka",
    btn_sv_at: "Bika Abitabiye", btn_s_al: "Hitamo Bose", btn_c_al: "Kura Bose",
    btn_src: "Shakisha", btn_trf: "Yimura", btn_snd: "Ohereza", btn_ad_ad: "Ongeramo Umuyobozi",
    btn_cr_ad: "Kora Umuyobozi", btn_rmv: "Kura Uburenganzira", btn_cr_nt: "Kora Itangazo",
    btn_pub: "Tangaza",
    
    // Isibo Directory
    is_t: "Urutonde rw'Amasibo", is_s: "Cunga abayobozi b'amasibo",
    is_s_tt: "Amasibo Yose", is_s_ld: "Abayobozi Bose", is_s_ct: "Abaturage Bose", is_l_t: "Urutonde rw'Amasibo",
    
    // Umuganda Tracker
    u_b_t: "Gukurikirana Umuganda", u_b_s: "Kurikirana abitabiriye umuganda",
    u_s_tt: "Abaturage Bose", u_s_at: "Abitabiriye", u_s_ab: "Abasibye", u_s_rt: "Ijanisha",
    u_l_t: "Urutonde rw'Abitabiriye", u_m_sd: "Hitamo Itariki",
    
    // Admin Inbox
    inb_t: "Ubutumwa", inb_s: "Cunga ubutumwa bwinjira",
    
    // Transfer Citizen
    tr_t: "Kwimura Umuturage",
    
    // Health Insurance
    ins_t: "Ubwishingizi bw'Indwara", ins_s: "Vugurura ubwishingizi bw'abaturage",
    i_s_tt: "Abaturage Bose", i_s_cv: "Abishingiwe", i_s_un: "Abatishingiwe", i_s_rt: "Ijanisha",
    ins_l_t: "Urutonde rw'Ubwishingizi",
    
    // Registration Form
    reg_t: "Kwandika Umuturage", ll_t: "Amakuru ya Nyiri Inzu", fam_t: "Amakuru y'Umuryango",
    fam_sp: "Uwo bashakanye", fam_ch: "Abana",
    
    // Manage Admins
    ma_t: "Cunga Abayobozi", ma_s: "Ongeramo abakozi kandi ucunge uburenganzira.",
    ma_nc: "Imyirondoro Mishya",
    
    // System Logs
    sl_t: "Amateka y'Ibyakozwe", sl_nl: "Nta mateka araboneka.",
    
    // Notices
    nt_t: "Amatangazo y'Abakozi", nt_s: "Amakuru n'amatangazo y'imbere.",
    nt_na: "Itangazo Rishya", nt_by: "Byanditswe na", nt_nn: "Nta matangazo arahari.",
    
    // Population Search
    pop_t: "Gushakisha Abaturage", pop_s: "Shakisha kandi uyungurure abaturage ukurikije imyaka n'inshingano.",
    lbl_role: "Yungurura ku nshingano", lbl_age_range: "Icyiciro cy'imyaka",
    opt_child: "Abana", opt_husband: "Umugabo", opt_wife: "Umugore",
    
    // Phone Ownership
    ph_own: "Numero yanjye", ph_sp: "Numero y'uwo bashakanye", ph_pa: "Numero y'umubyeyi", ph_fr: "Numero y'inshuti"
  },
  fr: {
    nav_login: "Connexion", nav_about: "À propos", nav_contact: "Contact",
    login_sub: "Système d'Information", login_err: "Identifiants incorrects !",
    lbl_user: "Nom d'utilisateur", lbl_pass: "Mot de passe", btn_login: "Connexion",
    abt_t: "À propos de Rusororo Village", abt_s: "Une administration intelligente.",
    cnt_t: "Contact", cnt_s: "Contacter l'administration.",
    sd_dash: "Tableau de bord", sd_isi: "Annuaire Isibo", sd_db: "Base de données",
    sd_reg: "Enregistrer", sd_inbox: "Boîte de réception", sd_ins: "Assurance Maladie",
    sd_umu: "Umuganda", sd_log: "Journal", sd_out: "Déconnexion",
    sd_trf: "Transférer un Citoyen", sd_ntc: "Avis au Personnel", sd_adm: "Gérer les Administrateurs",
    sd_map: "Carte Géospatiale", sd_pop: "Recherche de Population",
    app_sub: "Gérer Rusororo Cell.",
    st_tc: "Total Citoyens", st_ti: "Total Isibos", st_au: "Moy. Umuganda", st_hi: "Assurance Maladie",
    ch_gr_t: "Tendance de croissance", ch_gr_s: "Inscriptions (6 derniers mois)",
    ch_dm_t: "Démographie", ch_dm_s: "Âge et état civil",
    ch_hs_t: "Répartition des Logements", ch_in_t: "Couverture d'Assurance Maladie",
    dl_ad: "Adultes (18+)", dl_ch: "Enfants (<18)", dl_ma: "Marié(e)", dl_dw: "Divorcé(e)/Veuf(ve)",
    
    // Tables
    t_nam: "Nom", t_nid: "Carte d'Identité", t_phn: "Téléphone", t_mar: "État Civil",
    t_isn: "Isibo", t_typ: "Type de Logement", t_ins: "Assurance", t_umu: "Umuganda",
    t_act: "Action", t_dat: "Date", t_eml: "Email", t_msg: "Message",
    t_ldn: "Nom du Chef", t_ldp: "Téléphone du Chef", t_tct: "Total Citoyens", t_sts: "Statut",
    t_usr: "Nom d'utilisateur", t_rol: "Rôle", t_cat: "Créé à", t_tim: "Horodatage", t_dtl: "Détails",
    
    // Labels
    lbl_fnam: "Prénom", lbl_lnam: "Nom de famille", lbl_mnam: "Deuxième prénom", lbl_dob: "Date de Naissance",
    lbl_nid: "Carte d'Identité", lbl_phn: "Numéro de Téléphone", lbl_isn: "Isibo", lbl_typ: "Type de Logement",
    lbl_mar: "État Civil", lbl_rdt: "Date d'Inscription", lbl_dst: "Destination", lbl_rsn: "Raison",
    lbl_fnm: "Nom Complet", lbl_gen: "Genre", lbl_usr: "Nom d'utilisateur", lbl_rol: "Rôle",
    lbl_tit: "Titre (ex. Fermeture de bureau)", lbl_msg: "Contenu du message...",
    
    // Statuses & Options
    st_own: "Propriétaire", st_ten: "Locataire", st_sin: "Célibataire", st_mar: "Marié(e)",
    st_div: "Divorcé(e)", st_wid: "Veuf(ve)", st_pre: "Présent", st_abs: "Absent",
    opt_sel: "Sélectionner...", opt_male: "Homme", opt_female: "Femme",
    opt_adm: "Administrateur", opt_vw: "Observateur",
    opt_nrm: "Priorité Normale", opt_urg: "Priorité Urgente",
    
    // Buttons
    btn_sav: "Enregistrer", btn_dl_rp: "Télécharger le Rapport", btn_ad_is: "Ajouter Isibo", btn_cnl: "Annuler",
    btn_sv_at: "Enregistrer la Présence", btn_s_al: "Tout Sélectionner", btn_c_al: "Tout Effacer",
    btn_src: "Chercher", btn_trf: "Transférer", btn_snd: "Envoyer", btn_ad_ad: "Ajouter un Admin",
    btn_cr_ad: "Créer un Admin", btn_rmv: "Supprimer l'Accès", btn_cr_nt: "Créer un Avis",
    btn_pub: "Publier l'Avis",
    
    // Isibo Directory
    is_t: "Annuaire Isibo", is_s: "Gérer les chefs d'Isibo et les affectations",
    is_s_tt: "Total Isibos", is_s_ld: "Total Chefs", is_s_ct: "Total Citoyens", is_l_t: "Liste des Isibos",
    
    // Umuganda Tracker
    u_b_t: "Suivi Umuganda", u_b_s: "Suivre la présence aux travaux communautaires",
    u_s_tt: "Total Citoyens", u_s_at: "Présents", u_s_ab: "Absents", u_s_rt: "Taux de Présence",
    u_l_t: "Liste de Présence", u_m_sd: "Sélectionner la Date",
    
    // Admin Inbox
    inb_t: "Boîte de Réception", inb_s: "Gérer les messages entrants",
    
    // Transfer Citizen
    tr_t: "Transférer un Citoyen",
    
    // Health Insurance
    ins_t: "Assurance Maladie", ins_s: "Mettre à jour le fournisseur d'assurance",
    i_s_tt: "Total Citoyens", i_s_cv: "Couverts", i_s_un: "Non Assurés", i_s_rt: "Taux de Couverture",
    ins_l_t: "Liste d'Assurance",
    
    // Registration Form
    reg_t: "Enregistrer un Citoyen", ll_t: "Détails du Propriétaire", fam_t: "Détails de la Famille",
    fam_sp: "Conjoint", fam_ch: "Enfants",
    
    // Manage Admins
    ma_t: "Gestion des Administrateurs", ma_s: "Ajouter du personnel et gérer les accès.",
    ma_nc: "Nouveaux Identifiants",
    
    // System Logs
    sl_t: "Journal d'Activité", sl_nl: "Aucun journal enregistré.",
    
    // Notices
    nt_t: "Avis au Personnel", nt_s: "Annonces et mises à jour internes.",
    nt_na: "Nouvelle Annonce", nt_by: "Par", nt_nn: "Aucun avis publié.",
    
    // Population Search
    pop_t: "Recherche de Population", pop_s: "Recherchez et filtrez les résidents par rôle et par âge.",
    lbl_role: "Filtrer par rôle", lbl_age_range: "Tranche d'âge",
    opt_child: "Enfants", opt_husband: "Mari (Parent)", opt_wife: "Femme (Conjoint)",
    
    // Phone Ownership
    ph_own: "Mon propre numéro", ph_sp: "Numéro du conjoint", ph_pa: "Numéro du parent", ph_fr: "Numéro d'un ami"
  }
};
