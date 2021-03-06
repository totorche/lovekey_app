var platform = "";

var gamme_bague = "alliance";

var article_id = null;

var id_set_adaptateur = null;
var id_set_love = null;
var id_option_ada_or = null
var id_option_ada_titan = null;
var id_option_love_t = null;

var no_bague_displayed = 1;

var buy_link = "";

var orientation_value = "portrait";

var slide = null;
var sharing_menu_state = 0;
var connected = null;  // pour savoir si on est actuellement connecté ou pas

// pour défnir le type de connexion à internet
// 0 : pas de connexion ou type de connexion inconnu
// 1 : connexion 2G ou générique
// 2 : connexion 3G
// 3 : connexion 4G
// 4 : connexion Ethernet ou Wifi
var connexion = 0;

// pour le bruit d'un click
var clickSound = '';


// initialise l'application
function init_app(){

  // détecte la plateforme sur laquelle est lancée l'application
  platform = device.platform;

  // si on est Android
  if (platform == "Android"){
    // on change le viewport
    // $('meta[name=viewport]').attr('content', 'user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=320, height=480');

    // on masque le bouton permettant de lire la vidéo si pas de connexion
    $('#bouton_video_no_connection').hide();
    $('#message_video_patienter').hide();
    $('#video_lovekey').find('source').attr('src', 'http://lovekey.com/lovekey_mobile.mp4');
    // $('.video').addClass("android");
    $('#video_lovekey').addClass("android");

    $('#video_lovekey').on('touchend', show_video_controls);
  }
  else if (platform == "iOS"){
    $('#video_lovekey').wrap('<div class="video" />');
  }

   // vérifie la connexion à internet
  updateConnection();

  // s'il n'y a pas de connexion
  if (connexion < 1){
    // prépare la vue qui affiche un message d'avertissement et permet de visualiser la vidéo
    var defaultView = {
      title: "View no connection",
      backLabel: null,
      view: $('#view_no_connection').clone()
    };

    // configure le ViewNavigator
    window.viewNavigator = new ViewNavigator('body');

    // et y ajoute la première vue
    window.viewNavigator.pushView(defaultView);

    // dit que l'on est pas connecté
    connected = 0;

    // affiche un message d'avertissement
    navigator.notification.alert(
      "Attention : Vous ne disposez pas de connexion à internet. Cette application à besoin d'une connexion pour fonctionner.\n\r\n\rL'application se chargera automatiquement une fois qu'une connexion sera disponible.",  // message
      null,                       // callback
      "Connexion indisponible",   // titre
      'Ok'                        // texte par défaut
    );

    return false;
  }

  // configure la première vue (le configurateur)
  var defaultView = { 
    title: "Default View " + parseInt(Math.random()*1000),
    backLabel: null,
    view: $('#view_bagues')
  };

  // configure le ViewNavigator
  window.viewNavigator = new ViewNavigator('body');

  // et y ajoute la première vue
  window.viewNavigator.pushView(defaultView);

  // configure la sidebar
  slide = new SlidingView('sidebar', 'body');

  // récupert les différentes valeurs nécessaires
  $.getJSON('http://lovekey.com/content/get_lovekey_details_for_app.php', function(data) {
    
    if (data.id_set_adaptateur != undefined)
      id_set_adaptateur = data.id_set_adaptateur;
    if (data.id_set_love != undefined)
      id_set_love = data.id_set_love;
    if (data.id_option_ada_or != undefined)
      id_option_ada_or = data.id_option_ada_or;
    if (data.id_option_ada_titan != undefined)
      id_option_ada_titan = data.id_option_ada_titan;
    if (data.id_option_love_t != undefined)
      id_option_love_t = data.id_option_love_t;
    
    
    // récupert le dernier type d'affichage utilisé par l'utilisateur
    var configurateur_type = window.localStorage.getItem("type_configurateur");

    // si disponible, on affecte cette valeur à la listbox
    if (configurateur_type != undefined){
      $("select[name='type_configurateur']").val(configurateur_type);
    }
    // si pas disponible, on prend le premier type de configurateur disponible
    else{
      configurateur_type = $("select[name='type_configurateur']").val();
    }

    // initialise l'affichage
    change_type_configurateur(configurateur_type);
  });

  // lors d'un changement de type de configurateur
  $("select[name='type_configurateur']").change(function(){
    change_type_configurateur($(this).val());
  });

  // charge toutes les bagues sauvegardées
  load_saves();

  // appelle le changement d'orientation pour initialiser l'affichage correctement
  orientationChange();

  // pour afficher/masquer le menu
  $('#bouton_menu').on("touchend", toggle_slide);

  // pour afficher la bague n° 1
  $('#bouton_bague_1').on("touchend", function(){
    change_bague(1);
  });

  // pour afficher la bague n° 2
  $('#bouton_bague_2').on("touchend", function(){
    change_bague(2);
  });

  // pour la sauvegarde de la bague
  $('#bouton_enregistrer').on("touchend", save_confirmation);

  // pour charger les sauvegardes des bagues
  $('#bouton_charger').on("touchend", print_saves);

  // pour le lien vers la page du site Internet
  $('#bouton_acheter').on("touchend", goto_website);

  // pour la vidéo
  $('#bouton_video').on("touchend", print_video);

  // pour le partage
  $('#bouton_partager').on("touchend", toggle_sharing_menu);

  // pour fermer la fenêtre de partage
  $('#partage_fermer').on("touchend", toggle_sharing_menu);

  // lors d'un clic sur un bouton de partage
  $("#menu_partage").on("touchend", "li.partage", share_click);

  // pour le bouton de retour lorsque l'on est dans les sauvegarde
  $("body").on("touchend", ".bouton_retour", popView);

  // pour le bouton qui permet de supprimer une sauvegarde
  $("body").on("touchend", ".bouton_modifier_sauvegardes", modify_saves);

  // pour la vidéo "no connection"
  $("#bouton_video_no_connection").on("touchend", print_video);

  // lors d'un redimensionnement de la fenêtre (changement d'orientation)
  $(window).resize(window_change_size);

  // charge le son d'un click
  clickSound = new Media(getPhoneGapPath() + 'mouseclick.wav');

  // dit que l'on est connecté
  connected = 2;
}

// retourne le chemin du répertoire des données de l'application
function getPhoneGapPath() {
  var path = window.location.pathname;
  path = path.substr( path, path.length - 10 );
  return 'file://' + path;
};

// va sur le configurateur online (sur le site web) avec les bonnes options sélectionnées
function goto_website(){
  if (buy_link != undefined && buy_link != "")
    window.open(buy_link, '_system');
}

// affiche la bague 1 ou la bague 2
function change_bague(no_bague){
  if (no_bague != no_bague_displayed){
    if (no_bague == 1){
      $('#bouton_bague_1').css('background-position', '0 0');
      $('#bouton_bague_2').css('background-position', '-86px -29px');
      $('#bouton_bague_1').css('color', '#ffffff');
      $('#bouton_bague_2').css('color', '#93989d');

      $('.article1_picture').show();
      $('.article2_picture').hide();
      
    }
    else if (no_bague == 2){
      $('#bouton_bague_1').css('background-position', '0 -29px');
      $('#bouton_bague_2').css('background-position', '-86px 0');
      $('#bouton_bague_1').css('color', '#93989d');
      $('#bouton_bague_2').css('color', '#ffffff');

      $('.article1_picture').hide();
      $('.article2_picture').show();
    }
    
    no_bague_displayed = no_bague;
  }
}

// change le lien vers le site web
function change_link_to_website(){
  var type = $("select[name='type_configurateur']").val();
  var url = "";
  var url_picture = "";

  if (type == 1){
    url = "http://lovekey.com/configurateur-simple?gamme=bijou&options_init=";
    url_picture = "http://lovekey.com/content/print_product_image.php?gamme_bague=bijou&article_options=";
  }
  else if (type == 2){
    url = "http://lovekey.com/configurateur-simple?gamme=alliance&options_init=";
    url_picture = "http://lovekey.com/content/print_product_image.php?gamme_bague=alliance&article_options=";
  }
  else if (type == 3){
    url = "http://lovekey.com/configurateur-double?gamme=bijou&options_init=";
    url_picture = "http://lovekey.com/content/print_product_image.php?gamme_bague=bijou&article_options=";
  }
  else if (type == 4){
    url = "http://lovekey.com/configurateur-double?gamme=alliance&options_init=";
    url_picture = "http://lovekey.com/content/print_product_image.php?gamme_bague=alliance&article_options=";
  }

  // génère les paramètres à ajouter à l'url du site web
  params = new Array();

  // récupert les options
  $('.options_set').each(function(){
    params.push($(this).val());
  });
  // if (params.length == 3)
  params = params.join(",");

  url += params;
  url_picture += params;

  buy_link = url;

  // modifie les liens de partage
  $('.partage_facebook').data('sharelink', 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(buy_link));
  $('.partage_twitter').data('sharelink', 'http://twitter.com/home?status=Ma%20bague%20unique%20personnalis%C3%A9e%20sur%20Lovekey.com%20:%20' + encodeURIComponent(buy_link));
  $('.partage_pinterest').data('sharelink', 'http://pinterest.com/pin/create/button/?url=' + encodeURIComponent(buy_link) + '&media=' + encodeURIComponent(url_picture) + '&description=Ma%20bague%20unique%20personnalis%C3%A9e%20sur%20Lovekey%20:%20' + encodeURIComponent(buy_link));
  $('.partage_email').data('sharelink', 'mailto:?subject=Ma%20bague%20unique%20personnalis%C3%A9e%20sur%20Lovekey.com&body=Voici%20la%20bague%20unique%20et%20personnalis%C3%A9e%20que%20je%20me%20suis%20configur%C3%A9%20sur%20Lovekey.com%20:%20' + encodeURIComponent(buy_link));
}

// lors d'un changement d'orientation de l'appareil
function orientationChange(){
  // récupert la hauteur et la largeur de la fenêtre
  var windows_height = $(window).height();
  var windows_width = $(window).width();

  // vérifie l'orientation de l'appareil
  if (windows_height >= windows_width)
    orientation_value = "portrait";
  else
    orientation_value = "paysage";

  // si on est en mode "paysage"
  if (orientation_value == "paysage"){
    // affiche les 2 bagues
    $('.article_picture').show();

    // masque les boutons de changement de bague
    $('#boutons_bagues').hide();
    
    // recentre les images
    $('.articles_pictures').css('margin-top', '44px');

    // masque le logo
    if (windows_height < 400){
      $('#sidebar .logo').hide();
      $('#sidebar .logo_petit').hide();
      $('#sidebar .options').css('margin-top', '0');
      $('#sidebar').css('background-position', 'center -62px');
    }
  }
  // si on est en mode "portrait"
  if (orientation_value == "portrait"){
    // masque la 2ème bague
    $('.article2_picture').hide();

    // vérifie le type de configurateur
    var type_configurateur = $("select[name='type_configurateur']").val();

    // si 2 bagues sont affichées on affiche les boutons de changement de bague
    if (type_configurateur == 3 || type_configurateur == 4)
      $('#boutons_bagues').show();

    // recentre les images
    $('.articles_pictures').css('margin-top', '84px');

    // affiche le logo
    $('#sidebar .logo').show();
    $('#sidebar .logo_petit').show();
    $('#sidebar .options').css('margin-top', '20px');
    $('#sidebar').css('background-position', 'center 0');

    // sélectionne le bouton de la bague n° 1
    change_bague(1);
  }


  // switch(window.orientation){
  //   case -90:
  //   case 90:
  //   case undefined:
  //     // paysage
  //     orientation_value = "paysage";

  //     // affiche les 2 bagues
  //     $('.article_picture').show();

  //     // masque les boutons de changement de bague
  //     $('#boutons_bagues').hide();
      
  //     // recentre les images
  //     $('.articles_pictures').css('margin-top', '44px');

  //     // masque le logo
  //     $('#sidebar .logo').hide();
  //     $('#sidebar .logo_petit').hide();
  //     $('#sidebar .options').css('margin-top', '0');
  //     $('#sidebar').css('background-position', 'center -62px');
  //     break; 
  //   default:
  //     // portrait
  //     orientation_value = "portrait";

  //     // masque la 2ème bague
  //     $('.article2_picture').hide();

  //     // vérifie le type de configurateur
  //     var type_configurateur = $("select[name='type_configurateur']").val();

  //     // si 2 bagues sont affichées on affiche les boutons de changement de bague
  //     if (type_configurateur == 3 || type_configurateur == 4)
  //       $('#boutons_bagues').show();

  //     // recentre les images
  //     $('.articles_pictures').css('margin-top', '84px');

  //     // affiche le logo
  //     $('#sidebar .logo').show();
  //     $('#sidebar .logo_petit').show();
  //     $('#sidebar .options').css('margin-top', '20px');
  //     $('#sidebar').css('background-position', 'center 0');

  //     // sélectionne le bouton de la bague n° 1
  //     change_bague(1);
  //     break; 
  // }

  // redimensionne et replace l'image de fond
  var $img_background = $('img.bg');
  $img_background.height($img_background.parent().height() - 99);
  $img_background.css('left', ($img_background.parent().width() - $img_background.width()) / 2);

  // redimensionne les bagues selon l'orientation de l'appareil
  change_bague_size();
}


function window_change_size(){
  // vérifie l'orientation
  orientationChange();

  // redimensionne les bagues selon l'orientation de l'appareil
  change_bague_size();

  // redimensionne et replace l'image de fond
  // var $img_background = $('img.bg');
  // $img_background.height($img_background.parent().height() - 99);
  // $img_background.css('left', ($img_background.parent().width() - $img_background.width()) / 2);

  // recharge les bagues pour corriger un problème de taille de l'image de la bague
  if (orientation_value == "paysage"){
    if ($('#image_360_1').length > 0){
      Magic360.stop('image_360_1');
      Magic360.start('image_360_1');
    }

    if ($('#image_360_2').length > 0){
      Magic360.stop('image_360_2');
      Magic360.start('image_360_2');
    }

    // si la vidéo a déjà été lancée (sous Android)
    if ($("#video_lovekey").length > 0){
      // met la vidéo au bonnes dimension
      var myPlayer = videojs("video_lovekey");
      myPlayer.height($(window).height() - 55);
      myPlayer.width($(window).width());
    }
  }
  else if (orientation_value == "portrait"){
    if ($('#image_360_1').length > 0){
      Magic360.stop('image_360_1');
      Magic360.start('image_360_1');
    }

    // si la vidéo a déjà été lancée (sous Android)
    if ($("#video_lovekey").length > 0){
      // met la vidéo au bonnes dimension
      var myPlayer = videojs("video_lovekey");
      myPlayer.height($(window).height() - 55);
      myPlayer.width($(window).width());
    }
  }
}

// redimensionne les bagues selon l'orientation de l'appareil
function change_bague_size(){

  if (orientation_value == "paysage"){
    // récupert la hauteur de la fenêtre
    var windows_height = $(window).height();

    // définit la taille (hauteur = largeur) des bagues
    var magic360size = 240;

    // si la fenêtre n'est pas assez grande, on réduit la taille des bagues
    if (windows_height < 400)
      magic360size = 183;

    $("div.Magic360Contener").css({
      'width': magic360size + 'px',
      'height': magic360size + 'px'
    });

    // vérifie le type de configurateur
    var type_configurateur = $("select[name='type_configurateur']").val();

    // définit la taille de l'élément qui contient les bagues selon si 1 ou 2 bagues sont affichées
    if (type_configurateur == 1 || type_configurateur == 2){
      $('.articles_pictures').css('width', (magic360size + 20) + 'px');
    }
    else if (type_configurateur == 3 || type_configurateur == 4){
      $('.articles_pictures').css('width', (magic360size * 2 + 40) + 'px');
    }
  }
  else if (orientation_value == "portrait"){
    $("div.Magic360Contener").css({
      'width': '240px',
      'height': '240px'
    });

    $('.articles_pictures').css('width', '265px');
  }
}

// change le type de configurateur
function change_type_configurateur(val){

  // si le type de configurateur a été changé via le chargement d'une sauvegarde de bague, on sélectionne le bon élément dans la liste déroulante
  if ($("select[name='type_configurateur']").val() != val){
    $("select[name='type_configurateur']").val(val);
  }

  var options = new Array();
  
  // récupert les options (à partir du 2è paramètre)
  x = 0;
  for (i in arguments){
    if (x > 0 && !isNaN(arguments[i]))
      options.push(arguments[i]);

    x++;
  }

  // stock le type de configurateur
  window.localStorage.setItem("type_configurateur", val);

  if (val == 1){  // bijou célibataire
    article_id = 9;

    if (options.length == 3)
      reset(1, "bijou", options[0], options[1], options[2]);
    else
      reset(1, "bijou");

    // masque les boutons de changement de bague
    $('#boutons_bagues').css('display', 'none');

    // affiche la bague n° 1
    change_bague(1);
  }
  else if (val == 2){  // alliance célibataire
    article_id = 7;

    if (options.length == 3)
      reset(1, "alliance", options[0], options[1], options[2]);
    else
      reset(1, "alliance");

    // masque les boutons de changement de bague
    $('#boutons_bagues').css('display', 'none');

    // affiche la bague n° 1
    change_bague(1);
  }
  else if (val == 3){  // bijou couple
    article_id = 8;

    if (options.length == 6)
      reset(2, "bijou", options[0], options[1], options[2], options[3], options[4], options[5]);
    else
      reset(2, "bijou");

    if (orientation_value == "portrait")
      $('#boutons_bagues').css('display', 'block');
  }
  else if (val == 4){  // alliance bijou
    article_id = 3;

    if (options.length == 6)
      reset(2, "alliance", options[0], options[1], options[2], options[3], options[4], options[5]);
    else
      reset(2, "alliance");

    if (orientation_value == "portrait")
      $('#boutons_bagues').css('display', 'block');
  }
}

/**
 * Remet à zéro l'affichage
 * Les options à sélectionner par défaut peuvent être passées en paramètre (passer l'id de l'option à sélectionner).
 * Le premier paramètre sera pour le premier set d'option, etc.
 */
function reset(nb_pictures, gamme){

  var options = new Array();
  
  // récupert les options (à partir du 2è paramètre)
  x = 0;
  for (i in arguments){
    if (x > 1 && !isNaN(arguments[i]))
      options.push(arguments[i]);

    x++;
  }
  
  $('.article_sets').empty();
  $('.article_picture').empty();

  gamme_bague = gamme;

  if (nb_pictures == 1){
    if (options.length == 3)
      update_sets(0, options[0], options[1], options[2]);
    else
      update_sets(0);

    // $('.articles_pictures').css('width', '240px');
  }
  else if (nb_pictures == 2){

    if (options.length == 6){
      update_sets(1, options[0], options[1], options[2]);
      update_sets(2, options[3], options[4], options[5]);
    }
    else{
      update_sets(1);
      update_sets(2);
    }
    // $('.articles_pictures').css('width', '240px');
    // $('.articles_pictures').css('width', '470px');
  }
}

/**
 * Initialise les options
 * Les options à sélectionner par défaut peuvent être passées en paramètre (passer l'id de l'option à sélectionner).
 * Le premier paramètre sera pour le premier set d'option, etc.
 */   
function init_options(no_article){
  if (no_article == undefined)
    return;

  var options = new Array();
  
  // récupert les options (à partir du 2è paramètre)
  x = 0;
  for (i in arguments){
    if (x > 0 && !isNaN(arguments[i]))
      options.push(arguments[i]);

    x++;
  }

  var x = 0;

  var element = false;

  // parcourt chaque set d'option
  $('#article' + no_article + ' .options_set').each(function(){
    // si une option a été donnée, c'est cette option qui sera sélectionnée par défaut
    if (options[x] != undefined){
      var id_option = options[x];
      element = $(this).find('option.option_set_element.in_stock[value=' + id_option + ']');

      if (element && element.length > 0){
        // sélectionne la bonne option dans la listbox
        element.attr("selected", true);
        $(this).val(id_option);

        // désélectionne toutes les autres options
        $(this).find('option.option_set_element.in_stock[value!=' + id_option + ']').attr("selected", false);
      }
    }

    x++;
  });
}

// met à jour l'image de l'article en fonction des options sélectionnées
function update_picture(no_article){
  if (no_article == undefined)
    return;

  // génère les paramètres à envoyer au script affichant l'image
  params = new Array();

  // récupert les options
  $('#article' + no_article + ' .options_set').each(function(){
    params.push($(this).val());
  });

  // détermine si on doit retourner l'image ou pas selon si l'on affiche l'image de gauche ou de droite
  if (no_article == 1)
    do_mirror = 0;
  else
    do_mirror = 1;

  $.get("http://lovekey.com/content/get_product_image.php", {
    article_options: params,
    mirror: do_mirror,
    gamme_bague: gamme_bague
  },
  function(data){

    data = data.split("&&");

    if (no_article == 1)
      start_column = 1;
    else
      start_column = 9;

    // start_column = 1;

    // ajoute une image 360°
    var image_360 = $('<p><a href="http://lovekey.com/' + data[0] + '" class="Magic360" id="image_360_' + no_article + '" data-magic360-options="columns: 8; rows: 1; filename: ' + data[2] + '; large-filename: ' + data[2] + '; autospin: off; spin: hover; magnify: true; "><img src="http://lovekey.com/' + data[1] + '" alt=""/></a></p>');
    $('.article' + no_article + '_picture a#image_360_' + no_article).closest('p').remove();
    $('.article' + no_article + '_picture').append(image_360);
    if (Magic360){
      Magic360.start('image_360_' + no_article);
    }
  });
}

/**
 * met à jour les sets d'options
 * Les options à sélectionner par défaut peuvent être passées en paramètre (passer l'id de l'option à sélectionner).
 * Le premier paramètre sera pour le premier set d'option, etc.
 */
function update_sets(no_article){
  var nb_articles = 2;

  // si on affiche qu'une seule bague
  if (no_article == 0){
    no_article = 1;
    nb_articles = 1;
  }

  var options = new Array();
  
  // récupert les options (à partir du 2è paramètre)
  x = 0;
  for (i in arguments){
    if (x > 0 && !isNaN(arguments[i]))
      options.push(arguments[i]);

    x++;
  }

  // met à jour tous les sets d'options de l'article en cours
  $("#article" + no_article + " .article_sets").load("http://lovekey.com/content/shop_article_print_options.php", {
    aid: article_id,
    sid: '1_2_4',
    nb_articles: nb_articles
  }, function(){
    if (options.length == 3){
      var love_default_id = options[0];
      var adaptateur_default_id = options[1];
      var taille_default_id = options[2];
    }
    else{
      if (gamme_bague == "alliance" && no_article == 1){
        var love_default_id = 28;
        var adaptateur_default_id = 24;
        var taille_default_id = 40;
      }
      else if (gamme_bague == "alliance" && no_article == 2){
        var love_default_id = 28;
        var adaptateur_default_id = 24;
        var taille_default_id = 45;
      }
      else if (gamme_bague == "bijou" && no_article == 1){
        var love_default_id = 28;
        var adaptateur_default_id = 59;
        var taille_default_id = 45;
      }
      else if (gamme_bague == "bijou" && no_article == 2){
        var love_default_id = 28;
        var adaptateur_default_id = 59;
        var taille_default_id = 51;
      }
      else{
        var love_default_id = undefined;
        var adaptateur_default_id = undefined;
        var taille_default_id = undefined;
      }
    }
    
    // initialise les options (sans la gravure)
    init_options(no_article, love_default_id, adaptateur_default_id, taille_default_id, 11);
    
    // met à jour l'image de l'article
    update_picture(no_article);

    // met à jour le lien qui relie l'application au site web
    change_link_to_website();
    
    // met à jour le prix de l'article
    // update_price();
    
    // met à jour la quantité disponible
    // update_quantity();
    
    // met à jour le détails des options choisies
    // update_options_details();

    // gère la sélection des options de l'article
    $('#article' + no_article + ' .options_set').change(function(){
      // récupert l'id de l'option correspondant à l'image
      var id_option = $(this).val();
      
      // récupert l'id du set d'options
      var id_set = $(this).data('set-id');

      // si on sélectionne un Adaptateur en Or, on désactive la Love en Titan. Si Adaptateur en Titan (pour les 2 bagues), on active la Love en Titan
      if (id_set == id_set_adaptateur){
        // si Adaptateur Or
        if (jQuery.inArray(id_option, id_option_ada_or) != -1){
          // si la love en Titan était sélectionnée jusqu'à présent, on sélectionne la première Love activée
          var select_love = $("#article1").find("select[name=option_set_" + id_set_love + "]");

          var selected = select_love.find("option:selected");
          if (selected.prop("value") == id_option_love_t){
            var new_option = select_love.find("option:enabled:first");
            new_option.prop("selected", true);
            select_love.val(new_option.val());
            select_love.trigger('change');
          }
        }
      }

      // si on sélectionne une love en Titan, on sélectionne l'adaptateur en Titan également
      if (id_set == id_set_love){
        // si Love Titan
        if (id_option == id_option_love_t){
          // sélectionne les Adaptateurs Titan
          $.each(id_option_ada_titan, function(index, value){
            var select_adaptateur = $("#article" + no_article).find("select[name=option_set_" + id_set_adaptateur + "]");
            select_adaptateur.find("option[value=" + value + "]").prop("selected", true);
            select_adaptateur.val(value);
          })
        }
      }



      // si on sélectionne la love de la 1ère bague, on l'applique également à la 2è bague
      if (no_article == 1 && id_set == 1){
        var $listbox = $("#article2 select[name=option_set_1]");
        
        // désélectionne toutes les options
        $listbox.find("option").attr("selected", false);
        
        // sélectionne la bonne option dans la listbox
        $listbox.find("option[value=" + id_option + "]").attr("selected", true);
        $listbox.val(id_option);

        // déclenche l'événement "change" sur le select
        $listbox.trigger('change');
      }

      // si on modifie une option autre que la gravure
      if ($(this).attr('name') != 'option_set_5'){
        // met à jour l'image de l'article
        update_picture(no_article);

        // met à jour le lien qui relie l'application au site web
        change_link_to_website();
      }
      
      // met à jour le prix de l'article
      // update_price();
      
      // met à jour la quantité disponible
      // update_quantity();
      
      // met à jour le détails des options choisies
      // update_options_details();
      
      // définit l'id de l'option sélectionnée dans le formulaire d'ajout de l'article au panier
      // var input = $('input#input-article' + no_article + '-set-' + id_set);
      // if (input.length > 0){
      //   input.attr('value', id_option);
      // }
    });

    // gère le choix de l'utilisateur si gravure de l'article ou non
    // $('#article' + no_article + ' select[name=option_set_5]').change(function(){
    //   // affiche ou masque les données pour la gravure
    //   set_gravure(this, no_article);
    // });

    // si on a terminé l'initialisation des 2 sets d'options, on simule un changement d'adaptateur pour mettre en place les différentes règles
    if (no_article == 2)
      $("select.options_set[name=option_set_" + id_set_adaptateur + "]").trigger('change');
  });
}

// paramètre les termes du spinner 360°
Magic360.lang = {
  'hint-text': 'Tourner',
  'mobile-hint-text': 'Tourner'
};

// enlève la "publicité" du spinner 360°
Magic360.options = {
  'onready': function(spin){ 
    $(spin).find("div:contains('version')").remove();
    $("a.Magic360").parent("div").addClass("Magic360Contener");
    
    // redimensionne les bagues selon l'orientation de l'appareil
    change_bague_size();
  }
};









/**
 * Pour la gestion des sauvegardes et du chargement des bagues
 */

// pour le stockage des sauvagardes des bagues
var bagues_saves = Array();

// pour savoir si les boutons de suppression sont ouverts ou fermés (fermés au départ)
var modify_saves_open = false;

// affiche une boite de dialogue pour demander le nom de la sauvegarde à l'utilisateur
function save_confirmation() {
  clickSound.play();

  navigator.notification.prompt(
    'Sous quel nom voulez-vous sauvegarder votre bague ?',  // message
    save_bague,                   // callback to invoke
    'Sauvegarde de votre bague',  // title
    ['Valider','Annuler'],        // buttonLabels
    'ma bague Lovekey'            // texte par défaut
  );

  e.stopPropagation();
}

// charge toutes les sauvegardes
function load_saves(){

  // vide les sauvegardes déjà récupérées
  bagues_saves = Array();

  // récupert les sauvegardes
  var save = window.localStorage.getItem("sauvegardes_bagues");
  // if (save.length == 0)
  //   var save = "ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;ma bague 1&&1/5/2013&&1&&29,17,34;;ma bague 2&&24/12/2011&&2&&29,17,34;;";

  if (save != undefined && save != ''){

    // prépare les sauvegarde dans un tableau
    save = save.split(";;");

    // parcourt toutes les sauvegardes
    $.each(save, function(index, value){
      if (value != ''){
        // récupert les données de la sauvegarde en cours
        var data = value.split("&&");
        
        // vérifie qu'il y ait bien 3 informations (nom, type de configurateur, options)
        if (data.length != 4)
          return false;

        // prépare l'objet qui représentera la sauvegarde
        var element = {
          'name': data[0],
          'date': data[1],
          'type_configurateur' : data[2],
          'options': data[3].split(",")
        }

        // ajoute l'objet dans le tableau des sauvegardes
        bagues_saves.push(element);
      }
    });
  }
}

// sauvegarde la bague actuelle
function save_bague(results){
  // si la sauvegarde a été validée
  if (results.buttonIndex == 1){
    // récupert les sauvegardes actuelles
    var save = window.localStorage.getItem("sauvegardes_bagues");

    if (save == undefined)
      save = '';

    // prépare la nouvelle sauvegarde - ajoute le nom de la sauvegarde
    var value = results.input1 + "&&";

    // ajoute la date
    var date = new Date();
    value += date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + "&&";

    // ajoute le type de configurateur
    value += $("select[name='type_configurateur']").val() + "&&";

    // récupert les options
    options = new Array();
    $('.options_set').each(function(){
      options.push($(this).val());
    });
    options = options.join(",");

    // ajoute les options à la sauvegarde
    value += options;
    // stock la nouvelle sauvegarde
    if (save != '')
      save += ";;";

    save += value;
    window.localStorage.setItem("sauvegardes_bagues", save);
  }
}

// enregistre un tableau de sauvegardes
function save_saves(saves_tab){
  var save_str = '';
  $.each(bagues_saves, function(index, value){
    save_str += value.name + '&&' + value.date + '&&' + value.type_configurateur  + '&&' + (value.options).join(",") + ';;';
  });

  // supprime les 2 derniers ';;'
  if (save_str.length > 0)
    save_str.substring(0, save_str.length - 2);

  // enregistre les sauvegardes
  window.localStorage.setItem("sauvegardes_bagues", save_str);
}

// supprime une sauvegarde
function remove_save(index_to_remove){
  clickSound.play();

  function remove(buttonIndex){
    if (buttonIndex == 1){
      // supprime la sauvegarde du tableau
      bagues_saves.splice(index_to_remove, 1);

      // enregistre le nouveau tableau de sauvegardes
      save_saves(bagues_saves);

      // puis affiche les sauvegardes restantes
      print_saves_from_array(bagues_saves);
    }
  }

  navigator.notification.confirm(
    'Etes-vous sûr de vouloir supprimer cette sauvegarde ?',  // message
    remove,                          // callback to invoke
    "Suppression d'une sauvegarde",  // title
    ['Valider','Annuler']            // buttonLabels
  );
}

// affiche les sauvegarde disponibles
function print_saves(){
  clickSound.play();

  // met à jour les sauvegardes
  load_saves();

  // efface les sauvegardes déjà affichées
  $('#view_load .sauvegarde_bagues').empty();

  var x = 0;

  // parcourt toutes les sauvegardes et les affiche
  $.each(bagues_saves, function(index, value){
    msg = "<li>"
            +"<div class='save_data' ontouchend='javascript: load_bague(" + value.type_configurateur + ", \"" + (value.options).join(",") + "\");'>"
              +"<img src='img/fleche_droite.png' class='fleche_droite' />"
              +"<span class='save_name'>" + value.name + "</span>"
              +"<br>"
              +"<span class='save_date'>" + value.date + "</span>"
            +"</div>"
            +"<div class='save_modify' ontouchend='javascript: remove_save(" + x + ");'>supprimer</div>"
          +"</li>";

    $('#view_load .sauvegarde_bagues').append(msg);

    x++;
  });

  // configure la vue du chargeur de bague
  var view_saves = { 
    title: "Default View " + parseInt(Math.random()*1000),
    backLabel: 'retour',
    view: $('#view_load').clone()
  };

  // affiche la vue
  window.viewNavigator.pushView(view_saves);

  // affiche le contenu n° 2 pour la barre du haut
  // print_barreTop(2);

  // dit que les boutons de suppression sont fermés
  modify_saves_open = false;

  e.stopPropagation();
}

// affiche les sauvegarde à partir d'un tableau de sauvegardes donné
function print_saves_from_array(saves_array){
  // efface les sauvegardes déjà affichées
  $('#view_load .sauvegarde_bagues').empty();

  var x = 0;

  // parcourt toutes les sauvegardes et les affiche
  $.each(saves_array, function(index, value){
    msg = "<li>"
            +"<div class='save_data' ontouchend='javascript: load_bague(" + value.type_configurateur + ", \"" + (value.options).join(",") + "\");'>"
              +"<img src='img/fleche_droite.png' class='fleche_droite' />"
              +"<span class='save_name'>" + value.name + "</span>"
              +"<br>"
              +"<span class='save_date'>" + value.date + "</span>"
            +"</div>"
            +"<div class='save_modify' ontouchend='javascript: remove_save(" + x + ");'>supprimer</div>"
          +"</li>";

    $('#view_load .sauvegarde_bagues').append(msg);

    x++;

    // dit que les boutons de suppression sont fermés
    modify_saves_open = false;
  });
}

// charge une sauvegarde
function load_bague(type_configurateur, options){
  
  clickSound.play();

  // récupert les options dans un tableau
  var options = options.split(",");

  // revient à la vue précédente
  window.viewNavigator.popView();

  // affiche le contenu n° 1 pour la barre du haut
  // print_barreTop(1);

  // si le type de configurateur est pour une seule bague et que 3 options ont été données 
  if ((type_configurateur == 1 || type_configurateur == 2) && options.length == 3){
    // on change le type de configurateur et on initialise les bagues
    change_type_configurateur(type_configurateur, options[0], options[1], options[2]);
  }
  // si le type de configurateur est pour un couple de bagues et que 6 options ont été données
  else if ((type_configurateur == 3 || type_configurateur == 4) && options.length == 6){
    // on change le type de configurateur et on initialise les bagues
    change_type_configurateur(type_configurateur, options[0], options[1], options[2], options[3], options[4], options[5]);
  }
}

// affiche la possibilité de modifier (supprimer) les sauvegardes
function modify_saves(){

  clickSound.play();
  
  var delete_button_width = $(".save_modify").width() + 40;

  // si c'est ouvert
  if (modify_saves_open){
    $(".save_modify").animate(
      {right: "-=" + delete_button_width + "px"},
      200,
      "swing"
    );

    $(".save_data").animate(
      {right: "+=0px"}, 
      200,
      "swing"
    );

    modify_saves_open = false;
  }
  // si c'est fermé
  else{
    $(".save_data").animate(
      {right: "+=" + delete_button_width + "px"},
      200,
      "linear"
    );

    $(".save_modify").animate(
      {right: "+=0px"},
      200,
      "linear"
    );

    modify_saves_open = true;
  }

  e.stopPropagation();
}



var video_state = 0;

// affiche la vidéo
function print_video(){
  // si la connexion est minimum en 3G, on lit la vidéo via Vimeo
  // if (connexion >= 2){
  //   var ref = window.open('http://lovekey.com/app/video.html', '_self');
  // }
  // sinon on lit la vidéo en local
  // else{

  clickSound.play();

  // si on est sur une plateforme iOS
  if (platform == 'iOS'){
    // récupert les vidéos du site
    var video = $('video');

    // si des vidéos ont été trouvées, on joue la dernière
    if (video.length > 0){
      video = video[video.length - 1];
      video.play();
    }
  }
  // si on est sur une plateforme Android
  else if(platform == "Android"){
    // on doit gérer la vidéo via le plugin videojs
    // si le plugin n'a pas encore chargé la vidéo, on le fait
    if ($("video#video_lovekey").length > 0){
      videojs("video_lovekey", { 
        "controls": true, 
        "preload": true, 
        "width": "100%", 
        "height": ($(window).height() - 50) + "px",
        "customControlsOnMobile": true
      }, 
      function(){
        // affiche la vidéo online
        this.src({src: 'http://lovekey.com/lovekey_mobile.mp4'});
        $("#video_lovekey").css('display', 'block');
        // $(".video.android").css('display', 'block');

        // et la joue
        this.play();

        // masque la vidéo lorsque l'on appuye sur "Pause" ou que la lecture de la vidéo est terminée
        this.on("pause", hide_video);
        this.on("ended", hide_video);
      });

      video_state = 2;
    }
    // si le plugin est déjà prêt
    else{
      // affiche la vidéo
      var myPlayer = videojs("video_lovekey");
      $("#video_lovekey").css('display', 'block');
      // $(".video.android").css('display', 'block');

      $(".vjs-control-bar").css('visibility', 'visible');
      $(".vjs-control-bar").fadeIn();

      // et la joue
      myPlayer.play();

      video_state = 1;
    }
  }

  e.stopPropagation();
}

// masque la vidéo
function hide_video(){
  if (video_state == 2){
    $("#video_lovekey").css('display', 'none');
    // $(".video.android").css('display', 'none');
  }
  else if(video_state == 1){
    video_state = 2;
  }
}

function show_video_controls(){
  $(".vjs-control-bar").css('visibility', 'visible');
  $(".vjs-control-bar").css('z-index', '1003');
  $(".vjs-control-bar").fadeIn();
  $(".vjs-control-bar").show();
}

// lorsque l'on clique sur un bouton de partage
function share_click(share_button){
  clickSound.play();

  var target = '_blank';
  if ($(this).hasClass('partage_email'))
    target = '_system';

  window.open($(this).data('sharelink'), target, 'location=no');

  e.stopPropagation();
}

// pour ouvrir ou fermer le menu "slide"
function toggle_slide(){
  clickSound.play();

  if (slide.bodyOffset > 0){  
    slide.close();
  }
  else{
    slide.open();
  }

  e.stopPropagation();
}

// pour ouvrir ou fermer le menu de partage
function toggle_sharing_menu(e){
  clickSound.play();

  if (sharing_menu_state == 1){
    $('#menu_partage').animate(
      {
        height: '0'
      },
      function(){
        $('#menu_partage').hide();
      }
    );
    
    sharing_menu_state = 0;
  }
  else if (sharing_menu_state == 0){
    $('#menu_partage').show(
      function(){
        $('#menu_partage').animate({
          height: $(window).height() - 44
        });
      }
    );

    sharing_menu_state = 1;
  }
  
  e.stopPropagation();
}

// pour afficher ou masquer la page "déconnecté"
function toggle_disconnected(){
   // si on est connecté
  if (connected == 1){
    // revient à la vue précédente (vue principale)
    window.viewNavigator.popView();

    // dit qu'on est maintenant connecté
    connected = 2;
  }
  // si on est pas connecté, on affiche la vue "déconnecté"
  else if (connected == 2){
    // configure la vue "déconnecté"
    var defaultView = { 
      title: "Default View " + parseInt(Math.random()*1000),
      backLabel: null,
      view: $('#view_no_connection').clone()
    };

    // puis l'affiche
    window.viewNavigator.pushView(defaultView);

    // dit qu'on est maintenant déconnecté
    connected = 1;
  }
}

// revient à la vue précédente
function popView() {
  clickSound.play();

  window.viewNavigator.popView();
  
  // affiche le contenu n° 1 pour la barre du haut
  print_barreTop(1);

  e.stopPropagation();
}

// vérifie si on est connecté ou pas et affiche la bonne vue en fonction
function checkConnection(){
  var old_connexion = connexion;

  // vérifie la connexion à internet
  updateConnection();

  // si l'application n'a pas encore été initialisée
  if (connected == null){
    init_app();
  }
  // si on est maintenant déconnecté mais qu'on était auparavant connecté
  else if (connexion == 0 && connected == 2){
    toggle_disconnected();
    navigator.notification.alert(
      "Attention : Vous ne disposez pas de connexion à internet. Cette application à besoin d'une connexion pour fonctionner.\n\r\n\rL'application se chargera automatiquement une fois qu'une connexion sera disponible.",  // message
      null,                       // callback 
      "Connexion indisponible",   // titre
      'Ok'                        // texte par défaut
    );
  }
  // si on est maintenant connecté mais qu'on a jamais été connecté auparavant
  else if (connexion > 0 && connected == 0){
    init_app();
  }
  // si on est maintenant connecté mais qu'on était auparavant déconnecté
  else if (connexion > 0 && connected == 1){
    toggle_disconnected();
  }

  // affiche un message si la connexion est devenue lente (on est toutefois toujours connecté)
  if (connexion == 1 && old_connexion > 1 && connected == 2){
    navigator.notification.alert(
      "Attention : vous disposez d'une connexion à internet relativement lente. L'application mettra peut-être un peu de temps à charger",  // message
      null,                       // callback 
      "Connexion lente",   // titre
      'Ok'                        // texte par défaut
    );
  }

  // reteste la connexion toutes les 5 secondes
  setTimeout(checkConnection, 5000);
}

// retourne le type de connexion utilisé actuellement
function updateConnection() {
  try{
    var networkState = navigator.connection.type;

    if (networkState == Connection.UNKNOWN){
      connexion = 0;
    }
    else if (networkState == Connection.NONE){
      connexion = 0;
    }
    else if (networkState == Connection.CELL_2G){
      connexion = 1;
    }
    else if (networkState == Connection.CELL){
      connexion = 1;
    }
    else if (networkState == Connection.CELL_3G){
      connexion = 2;
    }
    else if (networkState == Connection.CELL_4G){
      connexion = 3;
    }
    else if (networkState == Connection.WIFI){
      connexion = 4;
    }
    else if (networkState == Connection.ETHERNET){
      connexion = 4;
    }
  }
  catch(err){
    connexion = 1;
  }

  return connexion;
}