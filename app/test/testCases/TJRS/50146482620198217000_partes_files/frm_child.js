/*! tjrs-site - v1.1.8 - 
Framework - v1.3.0
2018-07-30
 * http://tjrs.jus.br
 * Copyright (c) TJRS 2018; */

function showAjaxLoader(seletor, emptyContainer) {
  if (emptyContainer === undefined) emptyContainer = true;

  if (emptyContainer)
    jQuery(seletor)
      .empty()
      .append('<div class="ajax-loader"></div>');
  else jQuery(seletor).append('<div class="ajax-loader"></div>');
}

function hideAjaxLoader(seletor, emptyContainer) {
  if (emptyContainer === undefined) emptyContainer = true;

  if (emptyContainer) jQuery(seletor).empty();
  else
    jQuery(seletor)
      .find(".ajax-loader")
      .remove();
}

(function(window, undefined) {
  "use strict";

  var $AllLoaders = jQuery(".ajax-loader-component");
  if ($AllLoaders.length > 0) {
    for (var i = 0; i < $AllLoaders.length; i++) {
      var $loader = jQuery($AllLoaders[i]);

      var $component_form = jQuery($loader.data("form-select"));
      var $content_container = jQuery($loader.data("content-container"));
      var $trigger = jQuery($loader.data("trigger"));
      var $ajax_loader_container = jQuery(
        $loader.data("ajax-loader-container")
      );
      var $no_data = jQuery($loader.data("no-data"));
      var doneFunc = $loader.data("done-func");
      var $has_results = jQuery($loader.data("has-results"));

      var triggerCallbackGenerator = function(
        $content_container,
        $component_form,
        doneFunc,
        $trigger,
        $ajax_loader_container,
        $no_results,
        $no_data
      ) {
        return function(e) {
          var page_val = $('input[name="page"]').val();
          page_val++;
          $('input[name="page"]').val(page_val);
          e.preventDefault();
          actionTrigger(
            $content_container,
            $component_form,
            doneFunc,
            $trigger,
            $ajax_loader_container,
            $has_results,
            $no_data
          );
        };
      };

      $trigger.on(
        "click",
        triggerCallbackGenerator(
          $content_container,
          $component_form,
          doneFunc,
          $trigger,
          $ajax_loader_container,
          $has_results,
          $no_data
        )
      );

      if (!$loader.hasClass("no-initialized"))
        actionTrigger(
          $content_container,
          $component_form,
          doneFunc,
          $trigger,
          $ajax_loader_container,
          $has_results,
          $no_data
        );
    }
  }
})(this);

function actionTrigger(
  $content_container,
  $component_form,
  doneFunc,
  $trigger,
  $ajax_loader_container,
  $has_results,
  $no_data
) {
  var extraParams = [];
  if ($component_form.length > 0)
    extraParams = $component_form.serializeArray();

  //Adicionado caso o loader precise ser incluido em um container que não o de conteúdo (no caso do container de conteúdo ser uma ul, por exemplo)
  var $ajaxLoaderContainer = $content_container;
  if ($ajax_loader_container.length > 0)
    $ajaxLoaderContainer = $ajax_loader_container;

  showAjaxLoader($ajaxLoaderContainer, false);

  jQuery.get(FRMAjax.ajaxurl, extraParams, function(data) {
    if (data !== "") {
      $has_results.show();
      var newData = $content_container.append(data);

      if ($component_form.length > 0) {
        var pageVal = $component_form[0].elements["page"];
        if (pageVal) {
          pageVal = pageVal.value;
          //pageVal++;
          $component_form[0].elements["page"].value = pageVal;

          var totalItens = $(".ajax-loader-component .item").size();
          var totalRecordsVal = $('input[name="total_records"]')
            .last()
            .val();

          if (parseInt(totalRecordsVal) <= parseInt(totalItens)) {
            $trigger.hide();
          } else {
            $(".btn-more-news").fadeIn();
          }
        }
      }
      $(document).trigger("AJAX_INIT_COMPLETE", newData);
    } else {
      $no_data.show();
      $trigger.hide();
    }
    hideAjaxLoader($ajaxLoaderContainer, false);
    if (doneFunc !== undefined) window[doneFunc].call();
  });
}
$(document).ready(function() {
  if ($(".page").hasClass("avaliacao-servicos-de-limpeza")) {
    // salvar com sucesso
    if ($(".resultado").hasClass("salvo-sucesso")) {
      $("#form-avaliacao-limpeza .btn-mensagem").trigger("click");
    }

    jQuery("#form-avaliacao-limpeza").validate({
      errorClass: "invalido",
      validClass: "valido",
      highlight: function(element, errorClass, validClass) {
        jQuery(element)
          .parents(".relative")
          .addClass(errorClass)
          .removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        $(".bloco-erro").fadeOut();

        jQuery(element)
          .parents(".relative")
          .removeClass(errorClass)
          .addClass(validClass);
      },
      errorPlacement: function(error, element) {
        // console.log("ERROR PLACEMENT:", error, element.attr("name"));
        if (
          element.attr("name") === "observacao" ||
          element.attr("name") === "recolhimento_de_lixo_seco" ||
          element.attr("name") === "recolhimento_de_lixo_organico" ||
          element.attr("name") === "moveis" ||
          element.attr("name") === "vidros" ||
          element.attr("name") === "paredes_e_portas" ||
          element.attr("name") === "divisorias" ||
          element.attr("name") === "piso" ||
          element.attr("name") === "geladeira"
        ) {
          $(".bloco-erro").fadeIn();
        }
      },
      ignore: "",
      rules: {
        observacao: {
          required: true
        },
        recolhimento_de_lixo_seco: {
          required: true
        },
        recolhimento_de_lixo_organico: {
          required: true
        },
        moveis: {
          required: true
        },
        vidros: {
          required: true
        },
        paredes_e_portas: {
          required: true
        },
        divisorias: {
          required: true
        },
        piso: {
          required: true
        },
        geladeira: {
          required: true
        }
      }
    });
  }
});
function getBoletimForo(pagina) {
  var data = jQuery("#busca-boletim").serialize() + "&page=" + pagina;
  // console.log(data);
  // Trata se  a pagina for maior do que tem disponivel ele vai até a ultima só
  jQuery.post(FRMAjax.ajaxurl, data, function(response) {
    //response = (response);
    response = $.parseJSON(response);

    var html = "";

    if (response.colecao_boletim.length > 0) {
      jQuery.each(response.colecao_boletim, function(chave, objeto) {
        html += "<tr>";
        html += "	<td>" + objeto.titulo + "</td>";
        html += "	<td>" + objeto.comarca.name + "</td>";
        html += "	<td>" + objeto.mes + " / " + objeto.ano + "</td>";
        html +=
          '	<td><span class="rel-docs"><a href="' +
          objeto.arquivo_link +
          '" target="_blank"><span class="fa fa-arrow-circle-down"></span> .' +
          objeto.arquivo_extensao +
          " - " +
          objeto.arquivo_length +
          "</span></a></td>";
        html += "</tr>";
      });
    } else {
      html += "<tr>";
      html +=
        '<td class="dataTables_empty" colspan="4" valign="top">Sem resultados</td>';
      html += "</tr>";
    }

    $(".tabela-boletins tbody").html(html);
    jQuery(".pagination-content #numero-paginacao").val(response.pagina);
    jQuery(".pagination-content .qtd").text(response.total_pagina);
    //Encrementa a pagina
    if (response.total_pagina <= response.pagina) {
      $(".btn-next").attr("disabled", true);
      $(".btn-next").fadeOut();
    } else {
      $(".btn-next").attr("disabled", false);
      $(".btn-next").fadeIn();
    }

    $(".btn-next").attr("data-page", parseInt(response.pagina) + 1);

    if (response.pagina > 1 && response.total_pagina > 1) {
      $(".btn-prev").attr("disabled", false);
      $(".btn-prev").fadeIn();
    } else {
      $(".btn-prev").attr("disabled", true);
      $(".btn-prev").fadeOut();
    }

    jQuery(window).trigger("resize");

    $(".btn-prev").attr("data-page", parseInt(response.pagina) - 1);
  });
}

jQuery(function() {
  if (jQuery(".page").hasClass("boletins-de-foros")) {
    var options = {
      language: "pt-BR",
      format: "mm/yyyy",
      minViewMode: 1
    };

    //$('#datepicker-boletins').datepicker(options);

    $("#datepicker-boletins input[name=data_inicial_boletins]")
      .datepicker(options)
      .on("changeDate", function(selected) {
        startDate = new Date(selected.date.valueOf());
        startDate.setDate(startDate.getDate(new Date(selected.date.valueOf())));
        $("#datepicker-boletins input[name=data_final]").datepicker(
          "setStartDate",
          startDate
        );
      });

    $("#datepicker-boletins input[name=data_final_boletins]")
      .datepicker(options)
      .on("changeDate", function(selected) {
        FromEndDate = new Date(selected.date.valueOf());
        FromEndDate.setDate(
          FromEndDate.getDate(new Date(selected.date.valueOf()))
        );
        $("#datepicker-boletins input[name=data_inicial]").datepicker(
          "setEndDate",
          FromEndDate
        );
      });

    jQuery(".table").data("swipe-limit", 300);

    getBoletimForo(1);

    jQuery("#busca-boletim").submit(function(event) {
      getBoletimForo(1);
      return false;
    });
    jQuery(".pagination-content #numero-paginacao").blur(function(event) {
      getBoletimForo(jQuery(this).val());
    });
    jQuery(".pagination-content button").click(function() {
      var page = jQuery(this).attr("data-page");
      getBoletimForo(page);
    });

    jQuery(window).on("resize", function() {
      if (jQuery(window).width() < 768) {
        jQuery(".tabela-boletins").css(
          "width",
          jQuery(".table-wrapper").width() * 4
        );
      } else {
        jQuery(".tabela-boletins").css("width", "");
      }
    });
  }
});

// DESKTOP

$(".bloco-busca .tipo-consulta").change(function() {
  var tipo_consulta = $(this).val();
  ShowHideBuscaConsultaProcessual(tipo_consulta);
});

function ShowHideBuscaConsultaProcessual(item_to_show) {
  $(".bloco-busca .form-consulta-processual").hide();
  $(".bloco-busca ." + item_to_show).removeClass("hide");
  $(".bloco-busca ." + item_to_show).show();
  if (item_to_show === "por_execucao") {
    $(".bloco-busca ." + item_to_show)
      .parent()
      .find('button[type="submit"]')
      .hide();
    $(".combo_comarca_topo").hide();
  } else {
    $(".bloco-busca ." + item_to_show)
      .parent()
      .find('button[type="submit"]')
      .show();
    $(".combo_comarca_topo").show();
  }
}

// MOBILE

$(".busca-mobile .tipo-busca").change(function() {
  var tipo_busca = $(this).val();
  ShowHideTipoBuscaMobile(tipo_busca);
});

function ShowHideTipoBuscaMobile(item_to_show) {
  $(".busca-mobile .tipo-busca-mobile").hide();
  $(".busca-mobile #" + item_to_show).removeClass("hide");
  $(".busca-mobile #" + item_to_show).show();
}

$(".busca-mobile .tipo-consulta").change(function() {
  var tipo_consulta = $(this).val();
  ShowHideBuscaMobileConsultaProcessual(tipo_consulta);
});

function ShowHideBuscaMobileConsultaProcessual(item_to_show) {
  $(".busca-mobile .form-consulta-processual").hide();
  $(".busca-mobile ." + item_to_show).removeClass("hide");
  $(".busca-mobile ." + item_to_show).show();
  if (item_to_show === "por_execucao") {
    $(".busca-mobile ." + item_to_show)
      .parent()
      .find('button[type="submit"]')
      .hide();
  } else {
    $(".busca-mobile ." + item_to_show)
      .parent()
      .find('button[type="submit"]')
      .show();
  }
}
$.validator.addMethod(
  "selectcheck",
  function(value, element, arg) {
    return arg != value;
  },
  "requerido"
);

function validaCadastroEspecialistas(argument) {
  var formCadastro = $(".form-cadastro-especialistas");

  formCadastro.validate({
    errorClass: "invalido",
    validClass: "valido",
    highlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .addClass(errorClass)
        .removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .removeClass(errorClass)
        .addClass(validClass);
    },
    ignore: "",
    rules: {
      nome: {
        required: true
      },
      rua: {
        required: true
      },
      numero: {
        required: true
      },
      bairro: {
        required: true
      },
      cidade: {
        required: true
      },
      cep1: {
        required: true
      },
      cep2: {
        required: true
      },
      "ddd-residencial": {
        required: true
      },
      "numero-residencial": {
        required: true
      },
      "ddd-comercial": {
        required: true
      },
      "numero-comercial": {
        required: true
      },
      "ddd-celular": {
        required: true
      },
      "numero-celular": {
        required: true
      },
      email: {
        required: true,
        email: true
      },
      nacionalidade: {
        required: true
      },
      formacao: {
        required: true,
        selectcheck: "Selecione"
      },
      tipo: {
        required: true,
        selectcheck: "Selecione"
      }
    },
    submitHandler: function(form) {
      //
    }
  });
}

function selecao() {
  $(".lista-selecao").selectable({
    stop: function() {
      $(".btn-seleciona").on("click", function() {
        var result = $("#select-result").empty();

        $(".ui-selected").each(function() {
          var texto = $(this).html();
          result.append("<div class='lista-selecionados'>" + texto);
        });

        $(".lista-selecionados").on("click", function() {
          $(this).toggleClass("select");
        });

        $(".btn-remove").on("click", function() {
          $(".lista-selecionados.select").each(function() {
            $(this)
              .removeClass("select")
              .remove();
            var valor = $(this).html();

            $(".ui-selected").each(function() {
              var texto2 = $(this).html();

              if (texto2 == valor) {
                $(this).removeClass("ui-selected");
              }
            });

            if ($("#select-result").is(":empty")) {
              $("#select-result").append(
                "<div class='texto'>- Selecione - </div>"
              );
            }
          });
        });
      });
    }
  });
}

$(document).ready(function() {
  validaCadastroEspecialistas();
  selecao();

  jQuery(".numero").on("keyup", function() {
    this.value = this.value.replace(/[^0-9\.]/g, "");
  });

  $(".cep1").mask("99999");
  $(".cep2").mask("999");
  $(".ddd").mask("(99)");
  $(".tel").mask("9999-9999?9");
});

function termos() {
  $("#form-termos").on("submit", function(e) {
    $(".conteudo-content-geral").hide();
    $(".conteudo-content-geral.resposta").fadeIn(300);
  });
}

$(document).ready(function() {
  termos();
});
$(function() {
  //SalvarContadorVisualizacao();

  if ($("#id_campanha").size() > 0 && $("#id_campanha").val() != "") {
    var dados = {
      id: $("#id_campanha").val(),
      action: "SalvarContadorVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {}
    });
  }

  if ($(".page").hasClass("campanhas")) {
    $(".combo-campanha-categorias").change(function(e) {
      e.preventDefault();

      // elementos da caixa de pesquisa
      categoria = $(".combo-campanha-categorias").val();

      // carrega elementos form de resultado da tpl-campanhas-listagem no clique do form de pesquisa
      $('#form-campanhas input[name="page"]').val(1);
      $('#form-campanhas input[name="categoria"]').val(categoria);

      // serializa o form da lisagem de resultado e envia para método getcampanhas da campanhas-helper via ajax
      var data = $("#form-campanhas").serializeArray();

      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        $("#campanhas-container").html(response); // retorno html montato da funcao getcampanhas
      });
    });

    //MORE CAMPANHA
    /*$(".btn-more-news").on("click", function() {
			$(this).addClass("loading-news");

			setTimeout(function() {
				$(".btn-more-news").removeClass("loading-news");
			}, 2000);
		});*/
  }
});
$(function() {
  if ($(".page").hasClass("cardapios-de-restaurantes")) {
    $(document).ready(function(event) {
      setTimeout(function(argument) {
        $(".calendario").each(function() {
          equalheight($(this).find(".col"));
        });
      }, 100);

      sidebarResponsive();
    });
    $(window).on("resize", function() {
      $(".calendario .col").css("height", "");

      $(".calendario").each(function() {
        $(this)
          .find(".lista-cardapio")
          .width(
            $(this)
              .find(".coluna-destaque")
              .outerWidth() * 5
          );

        equalheight($(this).find(".col"));
      });
    });
  }
  //--- RESPONSIVE SIDEBAR
  function sidebarResponsive() {
    $(".tabela").data("swipe-limit", 500);
    $(".cardapio")
      .find(".button-responsive")
      .each(function(index) {
        $(this).data("index", index);
      })
      .on("click", handlerToggleButtons);

    $(".cardapio")
      .find(".col-xs-2")
      .each(function(index) {
        $(this).data("index", index);
      });

    $(".cardapio")
      .eq(0)
      .find(".button-responsive")
      .trigger("click");
  }

  function handlerToggleButtons(event) {
    event.preventDefault();
    $(".page-content")
      .find(".opened")
      .find(".fa-chevron-up")
      .removeClass("fa-chevron-up")
      .addClass("fa-chevron-down");

    $(".page-content")
      .find(".opened")
      .removeClass("opened");
    $(".cardapio")
      .eq($(event.currentTarget).data("index"))
      .addClass("opened");
    $(".cardapio")
      .eq($(event.currentTarget).data("index"))
      .find(".fa-chevron-down")
      .removeClass("fa-chevron-down")
      .addClass("fa-chevron-up");

    $(window).trigger("resize");
  }

  //--
  var prev, next;
  $(".slider-cardapio,.header-cardapio .periodos").each(function() {
    prev = $(this)
      .parents(".cardapio")
      .find(".pagination-content .btn-prev");
    next = $(this)
      .parents(".cardapio")
      .find(".pagination-content .btn-next");
    new DefaultSlider({
      container: this,
      options: {
        accessibility: true,
        infinite: true,
        slidesToShow: 1,
        autoplay: false,
        autoplaySpeed: 6000,
        dots: false,
        fade: true,
        pauseOnHover: false,
        arrows: true,
        prevArrow: prev,
        nextArrow: next
      }
    });
  });
});
var slickWidgetHomeDesk;
$(document).ready(function() {
  if ($("body").hasClass("criar-anuncio")) {
    $("#titulo-anuncio").keyup(function() {
      var len = $(this).val().length;
      var max = 141;
      if (len >= max) {
        $(this).val() = $(this)
          .val()
          .substring(0, max);
      } else {
        $(".total-char-titulo").text(len);
      }
    });
    $("#descricao-anuncio").keyup(function() {
      var len = $(this).val().length;
      var max = 2001;
      if (len >= max) {
        $(this).val() = $(this)
          .val()
          .substring(0, max);
      } else {
        $(".total-char-descricao").text(len);
      }
    });
  }

  if ($(".tipo-pagina").hasClass("editando")) {
    if ($(".primeira-imagem img").attr("src")) {
      $(".col-segunda-imagem")
        .fadeIn()
        .css("display", "table");
      $(".group-segunda-imagem")
        .fadeIn()
        .css("display", "table");
    }
    if ($(".segunda-imagem img").attr("src")) {
      $(".col-terceira-imagem")
        .fadeIn()
        .css("display", "table");
      $(".group-terceira-imagem")
        .fadeIn()
        .css("display", "table");
    }
  }

  $(".btn-remove-img-anuncio").click(function(e) {
    e.preventDefault();

    elementClass = $(this)
      .parent()
      .parent()
      .attr("class")
      .split(" ")[1];
    $(".group-" + elementClass)
      .fadeIn()
      .css("display", "table");
    $("." + elementClass).removeClass("can-edit");
    $("." + elementClass + " img").removeAttr("src");
    $("." + elementClass + " img").removeAttr("alt");
    $(".path-" + elementClass).val("");

    disableImg(elementClass);
  });

  function changeFakePath(elemento) {
    var caminho = $(elemento).val();
    var delimitador = caminho.lastIndexOf("\\");
    var nome = caminho.substring(delimitador + 1);
    $(".path-" + $(elemento).attr("id")).val('"' + nome + '"');
  }

  function disableImg(elemento) {
    if (elemento == "primeira-imagem") {
      $(".group-primeira-imagem").removeClass("group-image-none");
      $(".info-primeira-imagem").removeAttr("value");
    } else if (elemento == "segunda-imagem") {
      $(".group-segunda-imagem").removeClass("group-image-none");
      $(".info-segunda-imagem").removeAttr("value");
    } else if (elemento == "terceira-imagem") {
      $(".group-terceira-imagem").removeClass("group-image-none");
      $(".info-terceira-imagem").removeAttr("value");
    }
  }

  //MORE CLASSIFICADOS
  $(".btn-more-news").on("click", function() {
    $(this).addClass("loading-news");
    setTimeout(function() {
      $(".btn-more-news").removeClass("loading-news");
    }, 2000);
  });

  //BOTAO BUSCAR
  $(".classificados .search-container .btn-search").click(function(e) {
    e.preventDefault();

    descricao = $(
      '.classificados .search-container input[name="descricao"]'
    ).val();
    // categoria = $('.classificados .search-container select[name="categoria"]').val();
    // comarca = $('.classificados .search-container select[name="comarca"]').val();
    negociacao_tipo = $(
      '.classificados .search-container select[name="negociacao_tipo"]'
    ).val();

    $('#form-classificados input[name="page"]').val(1);
    $('#form-classificados input[name="descricao"]').val(descricao);
    // $('#form-classificados input[name="categoria"]').val(categoria);
    // $('#form-classificados input[name="comarca"]').val(comarca);
    $('#form-classificados input[name="negociacao_tipo"]').val(negociacao_tipo);

    var data = $("#form-classificados").serializeArray();

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      $("#classificados-container").html(response);
    });
  });

  $(".classificados .list-filtros .filter").on("click", function(event) {
    event.preventDefault();

    $(".category-list .filter-category").text($(this).text());

    categoria = $(this).attr("data-filter-id");

    $('#form-classificados input[name="page"]').val(1);
    $('#form-classificados input[name="categoria"]').val(categoria);

    var data = $("#form-classificados").serializeArray();

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      $("#classificados-container").html(response);

      var total_records = $('input[name="total_records"]')
        .last()
        .val();
      var items_per_page = $('input[name="items_per_page"]').val();

      if (parseInt(total_records) >= parseInt(items_per_page))
        $(".btn-carregar-mais").show();
      else $(".btn-carregar-mais").hide();
    });
  });

  var removingFlag = false;
  $(".btn-comfirm-remove").click(function(event) {
    event.preventDefault();
    if (removingFlag) return;

    var item = $(event.currentTarget)
      .parent()
      .parent()
      .parent()
      .parent()
      .parent();

    motivo = $(this)
      .parent()
      .find("input[name=remover-anuncio]:checked")
      .val();

    if (motivo !== undefined) {
      id = $(this)
        .parent()
        .find("input[name=id]")
        .val();
      acao = "remover";
      urlThis = window.location.href;
      urlData = "&id=" + id + "&motivo=" + motivo + "&acao=" + acao;
      console.log("urlData", motivo, motivo !== undefined);

      $(this)
        .addClass("loading-news")
        .html('<span class="fa fa-refresh"></span>Removendo');
      removingFlag = true;

      $.ajax({
        type: "POST",
        url: urlThis,
        async: true,
        data: urlData,
        error: function(xhr, statusText) {
          $(this)
            .removeClass("loading-news")
            .html("Remover anúncio");
          console.log("error: " + statusText);
          removingFlag = false;
        },
        success: function(data) {
          console.log("success");
          $(this)
            .removeClass("loading-news")
            .html("Remover anúncio");
          removingFlag = false;

          item.addClass("removed");
          setTimeout(function() {
            location.reload();
          }, 2000);
        },
        beforeSend: function() {
          console.log("beforeSend");
        },
        complete: function() {
          $(this)
            .removeClass("loading-news")
            .html("Remover anúncio");
          console.log("complete");
          removingFlag = false;
        }
      });
    } else {
      $(this)
        .parent()
        .find("label")
        .addClass("error");
    }
  });

  $('input[name="a-combinar"]').click(function() {
    var valor = $('input[name="valor"]');
    var sem_valor = $('input[name="sem-valor"]');
    if (valor.prop("disabled")) valor.prop("disabled", false);
    else valor.prop("disabled", true);

    if (sem_valor.prop("disabled")) sem_valor.prop("disabled", false);
    else sem_valor.prop("disabled", true);
  });

  $('input[name="sem-valor"]').click(function() {
    var valor = $('input[name="valor"]');
    var a_combinar = $('input[name="a-combinar"]');
    if (valor.prop("disabled")) valor.prop("disabled", false);
    else valor.prop("disabled", true);

    if (a_combinar.prop("disabled")) a_combinar.prop("disabled", false);
    else a_combinar.prop("disabled", true);
  });

  jQuery("#form-anuncio").validate({
    errorClass: "invalido",
    validClass: "valido",
    highlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".relative")
        .addClass(errorClass)
        .removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".relative")
        .removeClass(errorClass)
        .addClass(validClass);
    },
    errorPlacement: function(error, element) {
      console.log("ERROR PLACEMENT:", error, element.attr("name"));
      if (element.attr("name") === "tipo-negociacao") {
        error.appendTo($(".form-tipo").find(".title-form"));
      } else if (element.attr("name") === "title-anuncio") {
        error.appendTo($(".form-anuncio").find(".title-form"));
      } else if (element.attr("name") === "valor") {
        error.appendTo($(".form-value").find(".title-form"));
      } else if (element.attr("name") === "categoria") {
        error.appendTo($(".form-category").find(".title-form"));
      } else if (element.attr("name") === "descricao-anuncio") {
        error.appendTo($(".form-description").find(".title-form"));
      } else if (element.attr("name") === "email-anuncio") {
        error.appendTo($(".form-email").find(".title-form"));
      } else if (element.attr("name") === "termos-de-uso") {
        error.appendTo($(".checkbox-termos"));
      }
    },
    ignore: "",
    rules: {
      "tipo-negociacao": {
        required: true
      },
      "title-anuncio": {
        required: true,
        maxlength: 140
      },
      valor: {
        required: function(element) {
          return (
            !$('input[name="a-combinar"]').is(":checked") &&
            !$('input[name="sem-valor"]').is(":checked")
          );
        }
      },
      "descricao-anuncio": {
        required: true,
        maxlength: 2000
      },
      "email-anuncio": {
        required: true
      },
      "termos-de-uso": {
        required: true
      },
      categoria: {
        required: true
      }
    },
    messages: {
      "tipo-negociacao": {
        required: "campo obrigatório"
      },
      "title-anuncio": {
        required: "campo obrigatório"
      },
      valor: {
        required: "campo obrigatório"
      },
      "descricao-anuncio": {
        required: "campo obrigatório"
      },
      "email-anuncio": {
        required: "campo obrigatório"
      },
      "termos-de-uso": {
        required: "campo obrigatório"
      },
      categoria: {
        required: "campo obrigatório"
      }
    }
  });

  // DESABILITA O BOTAO NO CLICK
  $("#form-anuncio .btn-save").click(function() {
    if ($("#form-anuncio").valid())
      setTimeout(function() {
        $("#form-anuncio .btn-save").attr("disabled", "disabled");
      }, 300);
    else $("#form-anuncio .btn-save").removeAttr("disabled");
  });

  // salvar anuncio
  if ($(".resultado-anuncios").hasClass("salvo-sucesso")) {
    $("#form-anuncio .btn-mensagem").trigger("click");
  }

  $(".btn-renovar").click(function(event) {
    event.preventDefault();
    id = $(this)
      .parent()
      .find("input[name=id]")
      .val();
    acao = "renovar";
    urlThis = window.location.href;
    urlData = "&id=" + id + "&acao=" + acao;
    $.ajax({
      type: "POST",
      url: urlThis,
      async: true,
      data: urlData,
      error: function(xhr, statusText) {
        console.log("error: " + statusText);
      },
      success: function(data) {
        location.reload();
      },
      beforeSend: function() {
        $(event.currentTarget).addClass("btn-renovar-loading");
        $("#loader-geral").show();
      },
      complete: function() {
        console.log("complete");
        $(".btn-mensagem").trigger("click");
      }
    });
  });

  $("#mensagem-anuncio .btn-close-message").click(function(event) {
    href = $("footer .bloco-logo a").attr("href") + "/meus-anuncios/";
    $(location).attr("href", href);
  });

  if ($(".page").hasClass("editar-anuncio")) {
    $(".btn-remove").on("click", function(event) {
      event.preventDefault();
      var choosen = $(this)
        .parent()
        .parent()
        .attr("class")
        .split(" ")[1];
      $("#" + choosen)
        .parent()
        .parent()
        .parent()
        .children(".form-control")
        .val("");
      $(this)
        .parent()
        .parent()
        .find("img")
        .remove();
      $(this)
        .parent()
        .fadeOut(100);
    });
    $(".input-file").fileupload({
      dataType: "json",
      acceptFileTypes: /(\.|\/)(gif|jpe?g|png|bmp)$/i,
      add: function(event, data) {
        if (data.files && data.files[0]) {
          var newImage,
            reader = new FileReader();
          reader.onload = function(e) {
            newImage = document.createElement("img");
            newImage.src = e.target.result;

            $("." + event.target.id)
              .find(".overlay")
              .fadeIn(100);
            $("." + event.target.id)
              .find("img")
              .remove();
            $("." + event.target.id).prepend(newImage);
            $(event.target)
              .parent()
              .parent()
              .parent()
              .children(".form-control")
              .val(data.files[0].name);
          };
          reader.readAsDataURL(data.files[0]);

          //data.submit();
        }
      }
      /*done: function (e, data) {
				console.log( data.result.files );

				$.each(data.result.files, function (index, file) {
				//$('<p/>').text(file.name).appendTo(document.body);
				});
				}*/
    });
  }

  // Home de Classificados
  // araujo
  if (
    $("#div-featured-classificados").size() > 0 ||
    $("#banner-visualizados").size() > 0 ||
    $("#banner-anuncios").size() > 0
  ) {
    CarregarHomeClassificados();
  }
});

function CarregarHomeClassificados() {
  var data = { action: "CarregarHomeClassificados" };
  var response = "";

  jQuery.post(FRMAjax.ajaxurl, data, function(response) {
    $("#div-featured-classificados").html(response);
    //var partes = response.split("|||");
    //window.setTimeout('alert("teste")', 1000);

    var defaultSlick = {
      accessibility: true,
      infinite: true,
      slidesToShow: 1,
      autoplay: true,
      autoplaySpeed: 6000,
      dots: true,
      fade: true,
      pauseOnHover: false,
      arrows: false
    };
    if ($("#banner-visualizados").length > 0) {
      defaultSlick.appendDots = $("#controls-visualizados");

      var slickVisualizados = new DefaultSlider({
        container: "#banner-visualizados",
        options: defaultSlick
      });
    }

    if ($("#banner-anuncios").length > 0) {
      defaultSlick.appendDots = $("#controls-anuncios");

      var slickAnuncios = new DefaultSlider({
        container: "#banner-anuncios",
        options: defaultSlick
      });
    }
  });
}

function definirUpload(atual, proxima) {
  $("#" + atual + "-imagem").fileupload({
    url: FRMAjax.ajaxurl + "?action=uploadImagemPreview",
    autoUpload: true,
    acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,

    done: function(e, data) {
      var response = data.result;
      if (typeof response != "object") {
        response = $.parseJSON(response);
      }
      $("." + atual + "-imagem img").attr("src", response.url);
      $(".info-" + atual + "-imagem").val(response.attach_id);
      $(".group-" + atual + "-imagem").fadeOut();
      console.log($(".path-" + atual + "-imagem"), atual);
      if (
        data.files[0].name !== "" &&
        data.files[0].name !== undefined &&
        data.files[0].name !== null
      )
        $(".path-" + atual + "-imagem").val(data.files[0].name);

      $("." + atual + "-imagem").addClass("can-edit");

      if (proxima != "") {
        if ($(".info-" + proxima + "-imagem").val() == "") {
          $(".col-" + proxima + "-imagem")
            .fadeIn()
            .css("display", "table");
          $(".group-" + proxima + "-imagem")
            .fadeIn()
            .css("display", "table");
        }
      }
    },
    change: function(e, data) {
      $(".fotos-invalido").html("");
      $.each(data.files, function(index, file) {
        var url = file.name;
        var ext = url.substring(url.lastIndexOf(".") + 1).toLowerCase();
        $(".fotos-invalido").html("");
        if (ext == "gif" || ext == "png" || ext == "jpeg" || ext == "jpg") {
          return true;
        } else {
          $(".fotos-invalido").html("Formato Inválido");
        }
      });
    }
  });
}

$(document).ready(function() {
  if ($("body").hasClass("criar-anuncio")) {
    definirUpload("primeira", "segunda");
    definirUpload("segunda", "terceira");
    definirUpload("terceira", "");
  }
});
$(function() {
  //SalvarContadorVisualizacao();
  if ($("#id_clipping").size() > 0 && $("#id_clipping").val() != "") {
    var dados = {
      id: $("#id_clipping").val(),
      action: "SalvarContadorVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {}
    });
  }

  //ObterTotalVisualizacao();
  if (
    $("#total_views").size() > 0 &&
    $("#id_clipping").size() > 0 &&
    $("#id_clipping").val() != ""
  ) {
    var dados = {
      id: $("#id_clipping").val(),
      action: "ObterTotalVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {
        $("#total_views")
          .html('<span class="fa fa-eye"></span> ' + resposta)
          .show();
      }
    });
  }

  if ($(".page").hasClass("clipping")) {
    //FUNCOES DE BUSCA
    $(".combo-clipping-tipos").change(function(e) {
      e.preventDefault();

      // elementos da caixa de pesquisa
      descricao = $(
        '.clipping .search-container input[name="descricao"]'
      ).val();
      tipos = $('.page-header-filtro select[name="tipos"]').val();
      veiculos = $('.clipping .search-container select[name="veiculos"]').val();
      data_inicial = $(
        '.clipping .search-container input[name="data_inicial"]'
      ).val();
      data_final = $(
        '.clipping .search-container input[name="data_final"]'
      ).val();

      // carrega elementos form de resultado da tpl-clippings-listagem
      // no clique do form de pesquisa
      $('#form-clippings input[name="page"]').val(1);
      $('#form-clippings input[name="descricao"]').val(descricao);
      $('#form-clippings input[name="tipos"]').val(tipos);
      $('#form-clippings input[name="veiculos"]').val(veiculos);
      $('#form-clippings input[name="data_inicial"]').val(data_inicial);
      $('#form-clippings input[name="data_final"]').val(data_final);

      // serializa o form da lisagem de resultado e envia
      // para método getClippings da clippings-helper via ajax
      var data = $("#form-clippings").serializeArray();

      jQuery.post(
        FRMAjax.ajaxurl,
        //FRMAjax.ajaxurlv2,
        data,
        function(response) {
          $("#clippings-container").html(response); // retorno html montato da funcao getclippings
        }
      );
    });

    $(".clipping .search-container .btn-search").click(function(e) {
      e.preventDefault();

      // elementos da caixa de pesquisa
      descricao = $(
        '.clipping .search-container input[name="descricao"]'
      ).val();
      tipos = $('.page-header-filtro select[name="tipos"]').val();
      veiculos = $('.clipping .search-container select[name="veiculos"]').val();
      data_inicial = $(
        '.clipping .search-container input[name="data_inicial"]'
      ).val();
      data_final = $(
        '.clipping .search-container input[name="data_final"]'
      ).val();

      // carrega elementos form de resultado da tpl-clippings-listagem
      // no clique do form de pesquisa
      $('#form-clippings input[name="page"]').val(1);
      $('#form-clippings input[name="descricao"]').val(descricao);
      $('#form-clippings input[name="tipos"]').val(tipos);
      $('#form-clippings input[name="veiculos"]').val(veiculos);
      $('#form-clippings input[name="data_inicial"]').val(data_inicial);
      $('#form-clippings input[name="data_final"]').val(data_final);

      // serializa o form da lisagem de resultado e envia
      // para método getClippings da clippings-helper via ajax
      var data = $("#form-clippings").serializeArray();

      jQuery.post(
        FRMAjax.ajaxurl,
        //FRMAjax.ajaxurlv2,
        data,
        function(response) {
          $("#clippings-container").html(response); // retorno html montato da funcao getclippings
        }
      );
    });

    //MORE CLIPPINGS
    $(".btn-more-news").on("click", function() {
      $(this).addClass("loading-news");

      setTimeout(function() {
        $(".btn-more-news").removeClass("loading-news");
      }, 2000);
    });
  }
});
$(function() {
  if ($(".page").hasClass("colecao-administracao-judiciaria")) {
    //more colecao-administracao-judiciaria
    $(".btn-more-news").on("click", function() {
      $(this).addClass("loading-news");
      setTimeout(function() {
        $(".btn-more-news").removeClass("loading-news");
      }, 2000);
    });
  }
});
if ($("#form-comment").length > 0) {
  $("#mensagem-comentario").appendTo(document.body);

  // CADASTRA CONTATO
  $("#form-comment").submit(function(e) {
    e.preventDefault();

    var nome = $(this).find('input[name="comment-nome"]');
    var email = $(this).find('input[name="comment-email"]');
    var msg = $(this).find('textarea[name="comment-text"]');
    var msgErro = $(this).find(".msg-erro");

    if (nome.parent().hasClass("required") && nome.val() == "") {
      msgErro.css("display", "inline-block");
      return false;
    }
    if (email.parent().hasClass("required") && email.val() == "") {
      msgErro.css("display", "inline-block");
      return false;
    }
    if (msg.parent().hasClass("required") && msg.val() == "") {
      msgErro.css("display", "inline-block");
      return false;
    }

    var data = $(this).serializeArray();
    msgErro.hide();

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      var retorno = JSON.parse(response);
      if (retorno.url.indexOf("http") > -1) {
        $(".form-comment-wrapper .btn-mensagem").trigger("click");
        $("#topo-fixo").removeClass("show");
        window.location.href = retorno.url;
      }
    });
  });
}

$(".paginacao-comentarios").submit(function(e) {
  e.preventDefault();
  var destino = $(".numero-paginacao");
  url = destino.data("url");
  pagina = destino.val();
  window.location.href = url.replace("[PAGINA]", pagina);
});
$.validator.addMethod(
  "selectcheck",
  function(value, element, arg) {
    return arg != value;
  },
  "requerido"
);

function validaConsultaEspecialistas(argument) {
  var formFerramenta = $("#form-consulta-especialistas");

  formFerramenta.validate({
    errorClass: "invalido",
    validClass: "valido",
    highlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .addClass(errorClass)
        .removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .removeClass(errorClass)
        .addClass(validClass);
    },
    ignore: "",
    rules: {
      comarca: {
        required: true,
        selectcheck: "Selecione"
      },
      categoria: {
        required: true,
        selectcheck: "Selecione"
      }
    },
    submitHandler: function(form) {
      $(".conteudo-content-geral").hide();
      $(".conteudo-content-geral.resposta").fadeIn(300);
    }
  });
}

$(document).ready(function() {
  validaConsultaEspecialistas();

  $(".conteudo-content-geral.resposta .back-button").on("click", function() {
    $(".conteudo-content-geral").hide();
    $(".conteudo-content-geral.content").fadeIn(300);
  });
});

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires =
    "visited=true;expires= to visited=true;path=/;expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") c = c.substring(1);
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }
  return "";
}
// $.validator.addMethod("selectcheck", function(value, element, arg){
// 	return arg != value;
// }, "requerido");

function validaCriarEvento(argument) {
  $("#form-criar-evento").validate({
    errorClass: "invalido",
    validClass: "valido",
    highlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .addClass(errorClass)
        .removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .removeClass(errorClass)
        .addClass(validClass);
    },
    ignore: "",
    rules: {
      evento: {
        required: true
      },
      "data-inicial": {
        required: true
      },
      "data-final": {
        required: true
      },
      "hora-inicial": {
        required: true
      },
      "hora-final": {
        required: true
      },
      local: {
        required: true
      },
      endereco: {
        required: true
      },
      descricao: {
        required: true
      }
      // rua: {
      // 	required: true
      // },
      // numero: {
      // 	required: true
      // },
      // bairro: {
      // 	required: true
      // },
      // cidade: {
      // 	required: true
      // },
      // cep1: {
      // 	required: true
      // },
      // cep2: {
      // 	required: true
      // },
      // "ddd-residencial": {
      // 	required: true
      // },
      // "numero-residencial": {
      // 	required: true
      // },
      // "ddd-comercial": {
      // 	required: true
      // },
      // "numero-comercial": {
      // 	required: true
      // },
      // "ddd-celular": {
      // 	required: true
      // },
      // "numero-celular": {
      // 	required: true
      // },
      // email: {
      // 	required: true,
      // 	email: true
      // },
      // nacionalidade: {
      // 	required: true
      // },
      // formacao: {
      // 	required: true,
      // 	selectcheck: "Selecione"
      // },
      // tipo: {
      // 	required: true,
      // 	selectcheck: "Selecione"
      // }
    },
    submitHandler: function(form) {
      //
    }
  });
}

function upload() {}

$(document).ready(function() {
  validaCriarEvento();
  upload();

  $(".mask-hora").mask("00:00");
});

$(".cursos-realizados .search-container .btn-search").click(function(e) {
  e.preventDefault();

  // elementos da caixa de pesquisa
  descricao = $(
    '.cursos-realizados .search-container input[name="descricao"]'
  ).val();
  tipos = $('.cursos-realizados .search-container select[name="tipos"]').val();
  comarca = $(
    '.cursos-realizados .search-container select[name="comarca"]'
  ).val();
  data_inicial = $(
    '.cursos-realizados .search-container input[name="data_inicial"]'
  ).val();
  data_final = $(
    '.cursos-realizados .search-container input[name="data_final"]'
  ).val();

  // carrega elementos form de resultado da tpl-cursos-listagem no clique do form de pesquisa
  $('#form-cursos-realizados input[name="page"]').val(1);
  $('#form-cursos-realizados input[name="descricao"]').val(descricao);
  $('#form-cursos-realizados input[name="tipos"]').val(tipos);
  $('#form-cursos-realizados input[name="comarca"]').val(comarca);
  $('#form-cursos-realizados input[name="data_inicial"]').val(data_inicial);
  $('#form-cursos-realizados input[name="data_final"]').val(data_final);

  // serializa o form da lisagem de resultado e envia para método getcursos da cursos-helper via ajax
  var data = $("#form-cursos-realizados").serializeArray();

  jQuery.post(FRMAjax.ajaxurl, data, function(response) {
    $("#cursos-realizados-container").html(response); // retorno html montato da funcao getcursos
  });
});
var tjCurse, curseConfig;

$(function() {
  // Page-noticias
  if ($("#page_curso_id").size() > 0 && $("#page_curso_id").val() != "") {
    var dados = {
      id: $("#page_curso_id").val(),
      action: "CarregarPageCursos"
    };

    jQuery.ajax({
      data: dados,
      url: FRMAjax.ajaxurl,
      //dataType: "json",
      method: "GET",
      success: function(resposta) {
        var partes = resposta.split("|||");

        if (partes[0].trim() == "logado") {
          $("#div-meus-cursos-geral").show();
          $("#div-config-notificacoes").show();

          $(window).trigger("resize");
        }

        $("#div-meus-cursos-resultado").html(partes[1]);

        $("#config-cursos").html(partes[2]);

        $("#config-cursos")
          .find(".selectpicker")
          .each(function() {
            $(this).selectpicker({ container: "body" });
          });

        curseConfig.init();
        $(window).trigger("resize");
      }
    });
  }

  //SalvarContadorVisualizacao();

  if ($("#id_curso").size() > 0 && $("#id_curso").val() != "") {
    var dados = {
      id: $("#id_curso").val(),
      action: "SalvarContadorVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {}
    });
  }

  if ($(".page").hasClass("cursos")) {
    //FUNCOES DE BUSCA
    $('.page-header-filtro select[name="comarca"]').change(function(e) {
      e.preventDefault();

      // elementos de pesquisa
      comarca = $('.page-header-filtro select[name="comarca"]').val();

      // carrega elementos form de resultado da tpl-cursos-listagem no clique do form de pesquisa
      $('#form-cursos input[name="page"]').val(1);
      $('#form-cursos input[name="comarca"]').val(comarca);

      // serializa o form da lisagem de resultado e envia para método getcursos da cursos-helper via ajax
      var data = $("#form-cursos").serializeArray();

      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        $("#cursos-container").html(response); // retorno html montato da funcao getcursos
      });
    });

    $('.page-header-filtro select[name="tipos"]').change(function(e) {
      e.preventDefault();

      // elementos de pesquisa
      tipos = $('.page-header-filtro select[name="tipos"]').val();

      // carrega elementos form de resultado da tpl-cursos-listagem no clique do form de pesquisa
      $('#form-cursos input[name="page"]').val(1);
      $('#form-cursos input[name="tipos"]').val(tipos);

      // serializa o form da lisagem de resultado e envia para método getcursos da cursos-helper via ajax
      var data = $("#form-cursos").serializeArray();

      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        $("#cursos-container").html(response); // retorno html montato da funcao getcursos
      });
    });

    $(".cursos .search-container .btn-search").click(function(e) {
      e.preventDefault();

      $(this).html("<span class='fa fa-refresh'></span>Aguarde...");
      $(this).addClass("loading-news");

      // elementos da caixa de pesquisa
      descricao = $('.cursos .search-container input[name="descricao"]').val();
      tipos = $('.cursos .search-container select[name="tipos"]').val();
      comarca = $('.cursos .search-container select[name="comarca"]').val();
      data_inicial = $(
        '.cursos .search-container input[name="data_inicial"]'
      ).val();
      data_final = $(
        '.cursos .search-container input[name="data_final"]'
      ).val();
      status = $('.cursos .search-container select[name="status"]').val();

      // carrega elementos form de resultado da tpl-cursos-listagem no clique do form de pesquisa
      $('#form-cursos input[name="page"]').val(1);
      $('#form-cursos input[name="descricao"]').val(descricao);
      $('#form-cursos input[name="tipos"]').val(tipos);
      $('#form-cursos input[name="comarca"]').val(comarca);
      $('#form-cursos input[name="data_inicial"]').val(data_inicial);
      $('#form-cursos input[name="data_final"]').val(data_final);
      $('#form-cursos input[name="status"]').val(status);

      // serializa o form da lisagem de resultado e envia para método getcursos da cursos-helper via ajax
      var data = $("#form-cursos").serializeArray();

      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        $(".btn-search").html("<span class='fa fa-search'></span> Buscar");
        $(".btn-search").removeClass("loading-news");
        $("#cursos-container").html(response); // retorno html montato da funcao getcursos
      });
    });

    //MORE cursos
    $(".btn-more-news").on("click", function() {
      $(this).addClass("loading-news");

      setTimeout(function() {
        $(".btn-more-news").removeClass("loading-news");
      }, 2000);
    });
  }
});

$(function() {
  $("body").on("click", ".save-meus-cursos", function(e) {
    e.preventDefault();
    var data = $("#config-cursos").serializeArray();

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      if (response.indexOf("http") > -1) window.location.href = response;
    });
  });

  $(".keep-open").on({
    "hide.bs.dropdown": function() {
      return false;
    }
  });
  // 	if ( $( ".page" ).hasClass( "meus-anuncios" ) ) {

  // 		$( ".btn-remove" ).on( "click", function( event ) {
  // 			event.preventDefault();
  // 			var item = $(event.currentTarget).parent().parent().parent();
  // 			item.addClass( "opened" );

  // 			$( ".overlay-internas" ).on( "click", function() {
  // 				$(event.currentTarget).parent().find(".btn-manter").trigger("click");
  // 			} );

  // 			elementClass = $(this).parent().parent().attr('class').split(' ')[1];
  // 			$('.' + elementClass + ' img').removeAttr("src");
  // 			$('.path-' + elementClass).val('');

  // 			$( ".overlay-internas" ).stop(true).fadeIn( 500 );

  // 			$('html, body').animate({
  // 				scrollTop: $(this).parent().parent().offset().top - 100
  // 			}, 500);
  // 		});

  // 		$( ".btn-manter" ).on( "click", function( event ) {
  // 			event.preventDefault();
  // 			var item = $(event.currentTarget).parent().parent().parent().parent().parent();

  // 			//item.find(".btn-remove").trigger("click");
  // 			$( ".overlay-internas" ).off( "click" ).stop(true).fadeOut( 500 );
  // 			item.removeClass( "opened" );
  // 			$(event.currentTarget).parent().parent().parent().removeClass( "open" );
  // 		});

  // 		$( ".btn-fechar" ).on( "click", function( event ) {
  // 			event.preventDefault();
  // 			var item = $(event.currentTarget).parent().parent().parent().parent().parent();

  // 			//item.find(".btn-remove").trigger("click");
  // 			$( ".overlay-internas" ).off( "click" ).stop(true).fadeOut( 500 );
  // 			item.removeClass( "removed" );
  // 			item.removeClass( "opened" );
  // 			$(event.currentTarget).parent().parent().parent().removeClass( "open" );
  // 		});
  // 	}

  if ($(".page").hasClass("cursos")) {
    var timeoutSlick;

    $("body").on("click", ".comarca-item", function(e) {
      e.preventDefault();
      $(this).remove();
      $(".comarca-container .round-repeat").text($(".comarcas-list li").length);
    });

    $("body").on("click", "#news-button", function() {
      clearTimeout(timeoutSlick);
      timeoutSlick = setTimeout(function() {
        $(window).trigger("resize");
      }, 500);
    });

    //--- NEWS
    function Cursos() {
      var _scope = this,
        tabSizeActive = "";
      this.template =
        '<a href="javascript:void(0);" class="list-group-item news-item clearfix"><span class="conteudo-news"><span class="detalhe">{{CATEGORIA}}</span><span class="data">{{DATA}}</span>{{TEXTO}}</span></a>';
      this.newLength = 0;
      this.addedNews = [];

      this.init = function() {
        var scrollContainer;

        //DATE PICKER
        $(".input-daterange").datepicker({
          language: "pt-BR",
          keyboardNavigation: false,
          orientation: "top left",
          clearBtn: true,
          format: "dd/mm/yyyy"
        });

        // //MORE NEWS
        // $( ".btn-more-news" ).on( "click", function() {
        // 	$( this ).addClass( "loading-news" );

        // 	setTimeout(function() {
        // 		$( ".btn-more-news" ).removeClass( "loading-news" );
        // 	}, 2000);
        // } );

        //
        // $( "#destaques-button" ).on( "click", function() {
        // 	clearTimeout( timeoutSlick );
        // 	timeoutSlick = setTimeout(function() {
        // 		$('#banner-noticias').slick('setPosition');
        // 	}, 500);
        // } );

        $(window).on("resize", function() {
          if (
            ($(window).width() >= 768 && tabSizeActive === "xs") ||
            tabSizeActive === ""
          ) {
            tabSizeActive = "lg";
            $(".main-tab")
              .removeClass("in")
              .removeClass("active");
            $(".main-tab")
              .addClass("in")
              .addClass("active");

            //scrollContainer.update("relative");
          }
          if (
            ($(window).width() < 768 && tabSizeActive === "lg") ||
            tabSizeActive === ""
          ) {
            if (tabSizeActive === "xs") {
              //CONFIGURE AGAIN WHEN BACK FROM RESPONSIVE XS
              _scope.reConfig();
            }
            tabSizeActive = "xs";
            $(".main-tab")
              .removeClass("in")
              .removeClass("active");
            $(".main-tab")
              .eq(0)
              .addClass("in")
              .addClass("active");

            // scrollContainer.update("relative");
          }
        });

        $(".container-news").tinyscrollbar({ axis: "y", wheelLock: false });
        scrollContainer = $(".container-news").data("plugin_tinyscrollbar");

        $(window).trigger("resize");
      };

      this.init();
    }

    function CurseConfig() {
      var _scope = this,
        templateComarca =
          '<li class="comarca-item">{{NAME}} <a href="#"><span class="fa fa-times"></span></a></li>';

      this.init = function() {
        //TOGGLE
        //alert($( "#toggle-notifications" ).size());

        $("#toggle-notifications").bootstrapToggle({
          size: "mini",
          style: "toggle-rounded",
          onstyle: "success",
          offstyle: "danger",
          width: 80,
          height: 30,
          on: "SIM",
          off: "NÃO"
        });

        $(".comarca-container").tinyscrollbar({ wheelLock: false });
        $(".categoria-container").tinyscrollbar({ wheelLock: false });

        $(".add-comarca").css("display", "block");
        $("body").on("click", ".add-comarca .plus-button", function() {
          $(".add-comarca").css("display", "");
          $(".add-comarca-choice").css("display", "block");
        });
        $("body").on("click", ".add-comarca-choice .close-button", function() {
          $(".add-comarca").css("display", "block");
          $(".add-comarca-choice").css("display", "");
        });

        $("body").on("click", "#config-button", function() {
          clearTimeout(timeoutSlick);
          timeoutSlick = setTimeout(function() {
            $(".comarca-container").tinyscrollbar({ wheelLock: false });
            $(window).trigger("resize");
          }, 500);
        });

        //PICKER SELECT
        $("body").on("change", ".comarca-picker .selectpicker", function() {
          var selected = $(this).find("option:selected");

          clearTimeout(timeoutSlick);
          timeoutSlick = setTimeout(
            function() {
              $(".comarca-picker")
                .find(".selectpicker")
                .selectpicker("deselectAll");
              $(".comarca-picker")
                .find(".selectpicker")
                .selectpicker("refresh");

              _scope.addComarca(selected.text(), selected.val());
              _scope.addSelected(selected.val(), "comarcas");
            }.bind(this),
            100
          );
        });
        var i = 0;
        // // PICKER PUBLICOS
        $("body").on("change", ".tipos-picker .selectpicker", function() {
          var slugs = "";
          $(".tipos-picker .selectpicker option:selected").each(function() {
            if (slugs == "") separador = "";
            else separador = ",";
            slugs += separador + $(this).val();
          });
          $('input[name="tipos_frm"]').val(slugs);
        });

        // // PICKER PUBLICOS
        $("body").on("change", ".publico-picker .selectpicker", function() {
          var slugs = "";
          $(".publico-picker .selectpicker option:selected").each(function() {
            if (slugs == "") separador = "";
            else separador = ",";
            slugs += separador + $(this).val();
          });
          $('input[name="publicos_frm"]').val(slugs);
        });

        //PICKER NOTIFICACAO
        $("body").on("change", "#toggle-notifications", function() {
          $('input[name="recebe-notificacao"]').val($(this).is(":checked"));
        });
      };

      this.addSelected = function(slug, input) {
        var jaSelecionadas = $('input[name="' + input + '"]').val();
        if (jaSelecionadas == "") separador = "";
        else separador = ",";

        // if (input == 'categorias') {
        // 	if ($('input[name="'+ slug +'"]').is(':checked')) {
        // 		slug = jaSelecionadas + separador + slug;
        // 	}
        // 	else {
        // 		jaSelecionadas = jaSelecionadas.split(",");
        // 		indice = jaSelecionadas.indexOf(slug);
        // 		jaSelecionadas.splice(indice, 1);
        // 		slug = jaSelecionadas.toString();
        // 	}
        // }
        // else {
        slug = jaSelecionadas + separador + slug;
        // }

        $('input[name="' + input + '"]').val(slug);
      };

      this.addComarca = function(name, slug) {
        var item = $(
          templateComarca.replace("{{NAME}}", name).replace("{{SLUG}}", slug)
        );

        $(".comarcas-list").append(item);
        $(window).trigger("resize");

        $(item).click(function(e) {
          e.preventDefault();
          $(this).remove();
          $(".comarca-container .round-repeat").text(
            $(".comarcas-list li").length
          );
        });

        $(".comarca-container .round-repeat").text(
          $(".comarcas-list li").length
        );
      };

      this.init();
    }

    tjCurse = new Cursos();
    curseConfig = new CurseConfig();
  }

  // 	//
  // 	if ( $( ".single" ).hasClass( "single-evento" ) ) {
  // 		if ( $( ".map-gadget" ).find( "img" ).attr("src") !== "" ) {
  // 			$( ".map-gadget" ).find( "img" ).on( "load", function(event) {
  // 				$( event ).parent().removeClass("loading");
  // 			} );
  // 		} else {
  // 			$( ".map-gadget" ).removeClass("loading");
  // 			$( ".map-gadget" ).parent().parent().find( ".col-sm-6" ).addClass("col-sm-12").removeClass("col-sm-6")
  // 		}
  // 	}
});
$(function() {
  //SalvarContadorVisualizacao();
  if ($("#id_discurso").size() > 0 && $("#id_discurso").val() != "") {
    var dados = {
      id: $("#id_discurso").val(),
      action: "SalvarContadorVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {}
    });
  }

  //ObterTotalVisualizacao();
  if (
    $("#total_views").size() > 0 &&
    $("#id_discurso").size() > 0 &&
    $("#id_discurso").val() != ""
  ) {
    var dados = {
      id: $("#id_discurso").val(),
      action: "ObterTotalVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {
        $("#total_views")
          .html('<span class="fa fa-eye"></span> ' + resposta)
          .show();
      }
    });
  }

  if ($(".page").hasClass("discursos")) {
    $(".discursos .search-container .btn-search").click(function(e) {
      e.preventDefault();

      // elementos da caixa de pesquisa
      descricao = $(
        '.discursos .search-container input[name="descricao"]'
      ).val();
      data_inicial = $(
        '.discursos .search-container input[name="data_inicial"]'
      ).val();
      data_final = $(
        '.discursos .search-container input[name="data_final"]'
      ).val();

      // carrega elementos form de resultado da tpl-discursos-listagem no clique do form de pesquisa
      $('#form-discursos input[name="page"]').val(1);
      $('#form-discursos input[name="descricao"]').val(descricao);
      $('#form-discursos input[name="data_inicial"]').val(data_inicial);
      $('#form-discursos input[name="data_final"]').val(data_final);

      // serializa o form da lisagem de resultado e envia para método getdiscursos da discursos-helper via ajax
      var data = $("#form-discursos").serializeArray();

      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        $("#discursos-container").html(response); // retorno html montato da funcao getdiscursos
      });
    });

    //MORE DISCURSO
    $(".btn-more-news").on("click", function() {
      $(this).addClass("loading-news");

      setTimeout(function() {
        $(".btn-more-news").removeClass("loading-news");
      }, 2000);
    });

    // CONTADOR DE DISCURSOS ENCONTRADOS
    setInterval(function() {
      itens = $(".item").size();
      if (itens > 1) {
        $(".search-result strong").text(itens + " Discursos");
      } else if (itens == 1) {
        $(".search-result strong").text(itens + " Discurso");
      } else {
        $(".search-result strong").text("Nenhum Discurso");
      }
      $(".search-result").fadeIn();
    }, 100);
  }
});
function comentarios() {
  $(".btn-ver-comentarios").on("click", function() {
    $(".infos-comentarios").hide();
    $(".mais-comentarios").slideDown(250);
  });
}

$(document).ready(function() {
  comentarios();
});

$(".eventos-realizados .search-container .btn-search").click(function(e) {
  e.preventDefault();

  // elementos da caixa de pesquisa
  descricao = $(
    '.eventos-realizados .search-container input[name="descricao"]'
  ).val();
  categoria = $(
    '.eventos-realizados .search-container select[name="categoria"]'
  ).val();
  comarca = $(
    '.eventos-realizados .search-container select[name="comarca"]'
  ).val();
  data_inicial = $(
    '.eventos-realizados .search-container input[name="data_inicial"]'
  ).val();
  data_final = $(
    '.eventos-realizados .search-container input[name="data_final"]'
  ).val();

  // carrega elementos form de resultado da tpl-eventos-listagem
  // no clique do form de pesquisa
  $('#form-eventos-realizados input[name="page"]').val(1);
  $('#form-eventos-realizados input[name="descricao"]').val(descricao);
  $('#form-eventos-realizados input[name="categoria"]').val(categoria);
  $('#form-eventos-realizados input[name="comarca"]').val(comarca);
  $('#form-eventos-realizados input[name="data_inicial"]').val(data_inicial);
  $('#form-eventos-realizados input[name="data_final"]').val(data_final);

  // serializa o form da lisagem de resultado e envia
  // para método getEventos da eventos-helper via ajax
  var data = $("#form-eventos-realizados").serializeArray();

  jQuery.post(FRMAjax.ajaxurl, data, function(response) {
    $("#eventos-realizados-container").html(response); // retorno html montato da funcao getEventos
  });
});
var tjEvent, eventConfig;

$(function() {
  // Page-noticias
  if ($("#page_eventos_id").size() > 0 && $("#page_eventos_id").val() != "") {
    var dados = {
      id: $("#page_eventos_id").val(),
      action: "CarregarPageEventos"
    };

    jQuery.ajax({
      data: dados,
      url: FRMAjax.ajaxurl,
      method: "GET",
      success: function(resposta) {
        var partes = resposta.split("|||");

        if (partes[0].trim() == "logado") {
          $("#div-config-notificacoes").show();
        }

        $("#div-meus-eventos-resultado").html(partes[1]);

        $("#config-eventos").html(partes[2]);

        // araujo
        // inicializa o configurador
        eventConfig.init();
        $("#config-eventos")
          .find(".selectpicker")
          .each(function() {
            $(this).selectpicker({ container: "body" });
          });
        $(window).trigger("resize");
      }
    });
  }

  $("body").on("click", ".save-meus-eventos", function(e) {
    e.preventDefault();
    var data = $("#config-eventos").serializeArray();

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      if (response.indexOf("http") > -1) window.location.href = response;
    });
  });

  $("body").on("click", ".eventos .search-container .btn-search", function(e) {
    e.preventDefault();

    // elementos da caixa de pesquisa
    descricao = $('.eventos .search-container input[name="descricao"]').val();
    categoria = $('.eventos .search-container select[name="categoria"]').val();
    comarca = $('.eventos .search-container select[name="comarca"]').val();
    data_inicial = $(
      '.eventos .search-container input[name="data_inicial"]'
    ).val();
    data_final = $('.eventos .search-container input[name="data_final"]').val();

    // carrega elementos form de resultado da tpl-eventos-listagem
    // no clique do form de pesquisa
    $('#form-eventos input[name="page"]').val(1);
    $('#form-eventos input[name="descricao"]').val(descricao);
    $('#form-eventos input[name="categoria"]').val(categoria);
    $('#form-eventos input[name="comarca"]').val(comarca);
    $('#form-eventos input[name="data_inicial"]').val(data_inicial);
    $('#form-eventos input[name="data_final"]').val(data_final);

    // serializa o form da lisagem de resultado e envia
    // para método getEventos da eventos-helper via ajax
    var data = $("#form-eventos").serializeArray();

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      $("#eventos-container").html(response); // retorno html montato da funcao getEventos
    });
  });

  $(".keep-open").on({
    "hide.bs.dropdown": function() {
      return false;
    }
  });

  if ($(".page").hasClass("meus-anuncios")) {
    $(".btn-remove").on("click", function(event) {
      event.preventDefault();
      var item = $(event.currentTarget)
        .parent()
        .parent()
        .parent();
      item.addClass("opened");

      $(".conteudo-pagina-geral").addClass("item-opened");

      $(".overlay-internas").on("click", function() {
        $(event.currentTarget)
          .parent()
          .find(".btn-manter")
          .trigger("click");
      });

      elementClass = $(this)
        .parent()
        .parent()
        .attr("class")
        .split(" ")[1];
      $("." + elementClass + " img").removeAttr("src");
      $(".path-" + elementClass).val("");

      $(".overlay-internas")
        .stop(true)
        .fadeIn(500);

      $("html, body").animate(
        {
          scrollTop:
            $(this)
              .parent()
              .parent()
              .offset().top - 100
        },
        500
      );
    });

    $(".btn-manter").on("click", function(event) {
      event.preventDefault();
      var item = $(event.currentTarget)
        .parent()
        .parent()
        .parent()
        .parent()
        .parent();

      //item.find(".btn-remove").trigger("click");
      $(".overlay-internas")
        .off("click")
        .stop(true)
        .fadeOut(500);

      $(this)
        .parent()
        .find(".error")
        .removeClass("error");

      item.removeClass("opened");
      $(".conteudo-pagina-geral").removeClass("item-opened");

      $(event.currentTarget)
        .parent()
        .parent()
        .parent()
        .removeClass("open");
    });

    $("body").on("click", ".btn-fechar", function(event) {
      event.preventDefault();
      var item = $(event.currentTarget)
        .parent()
        .parent()
        .parent()
        .parent()
        .parent();

      //item.find(".btn-remove").trigger("click");
      $(".overlay-internas")
        .off("click")
        .stop(true)
        .fadeOut(500);

      item.removeClass("removed");
      item.removeClass("opened");
      $(".conteudo-pagina-geral").removeClass("item-opened");

      $(event.currentTarget)
        .parent()
        .parent()
        .parent()
        .removeClass("open");
    });
  }

  if ($(".page").hasClass("eventos")) {
    var timeoutSlick;

    $("body").on("click", ".comarca-item", function(e) {
      e.preventDefault();
      $(this).remove();
      var jaSelecionadas = $('input[name="comarcas"]').val();
      jaSelecionadas = jaSelecionadas.split(",");
      indice = jaSelecionadas.indexOf($(this).data("slug"));
      jaSelecionadas.splice(indice, 1);
      slug = jaSelecionadas.toString();
      $('input[name="comarcas"]').val(slug);

      $(".comarca-container .round-repeat").text($(".comarcas-list li").length);
    });

    $("body").on("click", "#news-button", function() {
      clearTimeout(timeoutSlick);
      timeoutSlick = setTimeout(function() {
        $(window).trigger("resize");
      }, 500);
    });

    //--- NEWS
    function Eventos() {
      var _scope = this,
        tabSizeActive = "";
      this.template =
        '<a href="javascript:void(0);" class="list-group-item news-item clearfix"><span class="conteudo-news"><span class="detalhe">{{CATEGORIA}}</span><span class="data">{{DATA}}</span>{{TEXTO}}</span></a>';
      this.newLength = 0;
      this.addedNews = [];

      this.init = function() {
        var scrollContainer;

        //MORE NEWS
        $(".btn-more-news").on("click", function() {
          $(this).addClass("loading-news");

          setTimeout(function() {
            $(".btn-more-news").removeClass("loading-news");
          }, 2000);
        });

        //
        $("#destaques-button").on("click", function() {
          clearTimeout(timeoutSlick);
          timeoutSlick = setTimeout(function() {
            $("#banner-noticias").slick("setPosition");
          }, 500);
        });

        $(window).on("resize", function() {
          if (
            ($(window).width() >= 768 && tabSizeActive === "xs") ||
            tabSizeActive === ""
          ) {
            tabSizeActive = "lg";
            $(".main-tab")
              .removeClass("in")
              .removeClass("active");
            $(".main-tab")
              .addClass("in")
              .addClass("active");

            //scrollContainer.update("relative");
          }
          if (
            ($(window).width() < 768 && tabSizeActive === "lg") ||
            tabSizeActive === ""
          ) {
            if (tabSizeActive === "xs") {
              //CONFIGURE AGAIN WHEN BACK FROM RESPONSIVE XS
              _scope.reConfig();
            }
            tabSizeActive = "xs";
            $(".main-tab")
              .removeClass("in")
              .removeClass("active");
            $(".main-tab")
              .eq(0)
              .addClass("in")
              .addClass("active");

            // scrollContainer.update("relative");
          }
        });

        $(".container-news").tinyscrollbar({ axis: "y", wheelLock: false });
        scrollContainer = $(".container-news").data("plugin_tinyscrollbar");

        $(window).trigger("resize");
      };

      this.init();
    }

    function EventConfig() {
      var _scope = this,
        templateComarca =
          '<li class="comarca-item">{{NAME}} <a href="#"><span class="fa fa-times"></span></a></li>';

      this.init = function() {
        //TOGGLE
        $("#toggle-notifications").bootstrapToggle({
          size: "mini",
          style: "toggle-rounded",
          onstyle: "success",
          offstyle: "danger",
          width: 80,
          height: 30,
          on: "SIM",
          off: "NÃO"
        });

        $(".comarca-container").tinyscrollbar({ wheelLock: false });
        $(".categoria-container").tinyscrollbar({ wheelLock: false });

        $(".add-comarca").css("display", "block");
        $("body").on("click", ".add-comarca .plus-button", function() {
          $(".add-comarca").css("display", "");
          $(".add-comarca-choice").css("display", "block");
        });

        $("body").on("click", ".add-comarca-choice .close-button", function() {
          $(".add-comarca").css("display", "block");
          $(".add-comarca-choice").css("display", "");
        });

        $("body").on("click", "#config-button", function() {
          clearTimeout(timeoutSlick);
          timeoutSlick = setTimeout(function() {
            $(".comarca-container").tinyscrollbar({ wheelLock: false });
            $(window).trigger("resize");
          }, 500);
        });

        //PICKER SELECT
        $(".comarca-picker")
          .find(".selectpicker")
          .on("change", function() {
            var selected = $(this).find("option:selected");

            clearTimeout(timeoutSlick);
            timeoutSlick = setTimeout(
              function() {
                $(".comarca-picker")
                  .find(".selectpicker")
                  .selectpicker("deselectAll");
                $(".comarca-picker")
                  .find(".selectpicker")
                  .selectpicker("refresh");

                _scope.addComarca(selected.text(), selected.val());
                _scope.addSelected(selected.val(), "comarcas");
              }.bind(this),
              100
            );
          });
        var i = 0;
        // // PICKER CATEGORIAS
        $(".categoria-picker")
          .find(".selectpicker")
          .on("change", function() {
            var slugs = "";
            $(".categoria-picker .selectpicker option:selected").each(
              function() {
                if (slugs == "") separador = "";
                else separador = ",";
                slugs += separador + $(this).val();
                i++;
              }
            );
            console.log(i);
            $('input[name="categorias"]').val(slugs);
          });

        // // PICKER PUBLICOS
        $(".publico-picker")
          .find(".selectpicker")
          .on("change", function() {
            var slugs = "";
            $(".publico-picker .selectpicker option:selected").each(function() {
              if (slugs == "") separador = "";
              else separador = ",";
              slugs += separador + $(this).val();
            });
            $('input[name="publicos"]').val(slugs);
          });

        //PICKER NOTIFICACAO
        $("#toggle-notifications").on("change", function() {
          $('input[name="recebe-notificacao"]').val($(this).is(":checked"));
        });
      };

      this.addSelected = function(slug, input) {
        var jaSelecionadas = $('input[name="' + input + '"]').val();
        if (input == "categorias") {
          if ($('input[name="' + slug + '"]').is(":checked")) {
            if (jaSelecionadas == "") separador = "";
            else separador = ",";
            slug = jaSelecionadas + separador + slug;
          } else {
            jaSelecionadas = jaSelecionadas.split(",");
            indice = jaSelecionadas.indexOf(slug);
            jaSelecionadas.splice(indice, 1);
            slug = jaSelecionadas.toString();
          }
        } else {
          if (jaSelecionadas == "") separador = "";
          else separador = ",";
          slug = jaSelecionadas + separador + slug;
        }

        $('input[name="' + input + '"]').val(slug);
      };

      this.addComarca = function(name, slug) {
        var item = $(
          templateComarca.replace("{{NAME}}", name).replace("{{SLUG}}", slug)
        );

        $(".comarcas-list").append(item);
        $(window).trigger("resize");

        $(item).click(function(e) {
          e.preventDefault();
          $(this).remove();
          $(".comarca-container .round-repeat").text(
            $(".comarcas-list li").length
          );
        });

        $(".comarca-container .round-repeat").text(
          $(".comarcas-list li").length
        );
      };

      this.init();
    }

    tjEvent = new Eventos();
    eventConfig = new EventConfig();
    //
  }

  //
  if ($(".single").hasClass("single-evento")) {
    if (
      $(".map-gadget")
        .find("img")
        .attr("src") !== ""
    ) {
      $(".map-gadget")
        .find("img")
        .on("load", function(event) {
          $(event)
            .parent()
            .removeClass("loading");
        });
    } else {
      $(".map-gadget").removeClass("loading");
      $(".map-gadget")
        .parent()
        .parent()
        .find(".col-sm-6")
        .addClass("col-sm-12")
        .removeClass("col-sm-6");
    }
  }
});

jQuery.validator.addMethod(
  "cpf",
  function(value, element) {
    value = jQuery.trim(value);

    value = value.replace(".", "");
    value = value.replace(".", "");
    cpf = value.replace("-", "");
    while (cpf.length < 11) cpf = "0" + cpf;
    var expReg = /^0+$|^1+$|^2+$|^3+$|^4+$|^5+$|^6+$|^7+$|^8+$|^9+$/;
    var a = [];
    var b = new Number();
    var c = 11;
    for (i = 0; i < 11; i++) {
      a[i] = cpf.charAt(i);
      if (i < 9) b += a[i] * --c;
    }
    if ((x = b % 11) < 2) {
      a[9] = 0;
    } else {
      a[9] = 11 - x;
    }
    b = 0;
    c = 11;
    for (y = 0; y < 10; y++) b += a[y] * c--;
    if ((x = b % 11) < 2) {
      a[10] = 0;
    } else {
      a[10] = 11 - x;
    }
    if (cpf.charAt(9) != a[9] || cpf.charAt(10) != a[10] || cpf.match(expReg))
      return this.optional(element) || false;
    return this.optional(element) || true;
  },
  "Por favor, informe um CPF válido"
);

jQuery.validator.addMethod(
  "dateBR",
  function(value, element) {
    //contando chars
    if (value.length != 10) return this.optional(element) || false;
    // verificando data
    var data = value;
    var dia = data.substr(0, 2);
    var barra1 = data.substr(2, 1);
    var mes = data.substr(3, 2);
    var barra2 = data.substr(5, 1);
    var ano = data.substr(6, 4);
    if (
      data.length != 10 ||
      barra1 != "/" ||
      barra2 != "/" ||
      isNaN(dia) ||
      isNaN(mes) ||
      isNaN(ano) ||
      dia > 31 ||
      mes > 12
    )
      return this.optional(element) || false;
    if ((mes == 4 || mes == 6 || mes == 9 || mes == 11) && dia == 31)
      return this.optional(element) || false;
    if (mes == 2 && (dia > 29 || (dia == 29 && ano % 4 != 0)))
      return this.optional(element) || false;
    if (ano < 1900) return this.optional(element) || false;
    return this.optional(element) || true;
  },
  "Por favor, informe uma data válida"
); // Mensagem padrão

function formContato(argument) {
  var form = $("#form-contato");

  form.validate({
    errorContainer: ".help-block",
    errorLabelContainer: ".erros",
    errorElement: "li",
    errorClass: "invalido",
    validClass: "valido",
    highlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .addClass(errorClass)
        .removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .removeClass(errorClass)
        .addClass(validClass);
    },
    ignore: "",
    rules: {
      nome: {
        required: true,
        minlength: 2
      },
      cpf: {
        required: true,
        cpf: true
      },
      nascimento: {
        required: true,
        dateBR: true
      },
      endereco: {
        required: true
      },
      estado: {
        required: true
      },
      cidade: {
        required: true
      }
      // password: {
      // 	required: true,
      // 	minlength: 5
      // },
      // confirm_password: {
      // 	required: true,
      // 	minlength: 5,
      // 	equalTo: "#password"
      // },
      // email: {
      // 	required: true,
      // 	email: true
      // },
      // topic: {
      // 	required: "#newsletter:checked",
      // 	minlength: 2
      // },
      // agree: "required"
    },
    messages: {
      nome: {
        required: "Por favor, informe seu nome",
        minlength: "Seu nome deve consistir em pelo menos 2 caracteres"
      },
      cpf: {
        required: "Por favor, informe seu CPF",
        cpf: "Por favor, informe um CPF válido"
      },
      nascimento: {
        required: "Por favor, informe sua data de nascimento",
        dateBR: "Por favor, informe uma data válida"
      },
      endereco: {
        required: "Por favor, informe seu endereço"
      },
      estado: {
        required: "Por favor, selecione seu estado"
      },
      cidade: {
        required: "Por favor, selecione sua cidade"
      }
      // password: {
      // 	required: "Please provide a password",
      // 	minlength: "Your password must be at least 5 characters long"
      // },
      // confirm_password: {
      // 	required: "Please provide a password",
      // 	minlength: "Your password must be at least 5 characters long",
      // 	equalTo: "Please enter the same password as above"
      // },
      // email: "Please enter a valid email address",
      // agree: "Please accept our policy",
      // topic: "Please select at least 2 topics"
    }
  });

  $("#form-contato select").on("change", function(e) {
    form.validate().element($(this));
  });
}

$(document).ready(function() {
  formContato();

  jQuery("input.cpf").mask("000.000.000-00");
  jQuery("input.date").mask("00/00/0000");

  jQuery("input.cep").mask("00000-000");
  jQuery("input.fone").mask("(00) 0000-0000");
});

$(document).ready(function(argument) {
  var DRAG_OBJ,
    FAV_STATE = "normal",
    templateFav =
      '<div class="meu-favorito-item list-group-item temp-drag"><a class="btn"><span class="fa state-fav fa-arrow-down"></span> Solte aqui</a></div>',
    defaultSaveEditText = $(".btn-save-edit").html();

  function handlerCancel(event) {
    event.preventDefault();

    FAV_STATE = "normal";

    $(".btn-cancel").hide();
    $(".btn-save-edit").html(defaultSaveEditText);

    changeFavsIcons();
  }

  function handlerEditSave(event) {
    event.preventDefault();

    if (FAV_STATE === "normal") {
      FAV_STATE = "editing";

      $(".btn-cancel").show();
      $(event.currentTarget).html(
        'Salvar alterações <span class="fa fa-floppy-o"></span>'
      );
    } else {
      FAV_STATE = "normal";

      var items_favs = $(".meu-favorito-item");
      var favoritos = [];
      items_favs.each(function() {
        favoritos.push($(this).data("item-id"));
      });

      var data = {
        action: "SaveMyFavorites",
        favoritos: favoritos
      };

      $(".btn-cancel").hide();

      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        if (response === "sucesso") {
          $(".meus-favoritos .result")
            .html("Sua lista foi salva com sucesso.")
            .css("display", "inline-block")
            .show()
            .delay(4000)
            .fadeOut("slow", function() {
              $(".meus-favoritos .result").html("");
              location.reload();
            });
        } else {
          $(".meus-favoritos .result")
            .html("Sua lista foi salva com sucesso.")
            .css("display", "inline-block")
            .show()
            .delay(4000)
            .fadeOut("slow", function() {
              $(".meus-favoritos .result").html("");
            });
        }
      });

      $(event.currentTarget).html(defaultSaveEditText);
    }

    changeFavsIcons();
  }
  function handlerFavs(event) {
    event.preventDefault();

    console.log(
      $(this)
        .parent()
        .data("index")
    );

    if (FAV_STATE === "normal") {
      location.href = $(event.currentTarget).attr("href");
    }

    //ON DELETE
    if ($(event.target).hasClass("fa-trash")) {
      $(this)
        .parent()
        .remove();
      var favorito_id = $(this)
        .parent()
        .data("item-id");
      var data = {
        action: "DeleteMyFavorites",
        favorito_id: favorito_id
      };

      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        if (response === "sucesso") {
          $(".meus-favoritos .result")
            .html("Favorito removido.")
            .css("display", "inline-block")
            .show()
            .delay(3000)
            .fadeOut("slow", function() {
              $(".meus-favoritos .result").html("");
            });
        } else {
          $(".meus-favoritos .result")
            .html("Favorito removido.")
            .css("display", "inline-block")
            .show()
            .delay(3000)
            .fadeOut("slow", function() {
              $(".meus-favoritos .result").html("");
            });
        }
      });
    }
  }

  function changeFavsIcons() {
    $(".meu-favorito-item")
      .find(".state-fav, .action-fav")
      .removeClass("fa-star fa-chevron-right fa-trash fa-bars");

    if (FAV_STATE === "normal") {
      $(".listagem-meus-favoritos").removeClass("editing");
      $(".meu-favorito-item").addClass("unsortable");
      $(".meu-favorito-item")
        .find(".state-fav")
        .addClass("fa-star");
      $(".meu-favorito-item")
        .find(".action-fav")
        .addClass("fa-chevron-right");
    } else {
      $(".listagem-meus-favoritos").addClass("editing");
      $(".meu-favorito-item").removeClass("unsortable");
      $(".meu-favorito-item")
        .find(".state-fav")
        .addClass("fa-trash");
      $(".meu-favorito-item")
        .find(".action-fav")
        .addClass("fa-bars");
    }
  }
  function listFav(data) {
    $(data)
      .removeAttr("style")
      .sortable({
        cursor: "grabbing",
        placeholder: "meu-favorito-item list-group-item temp-drag",
        cancel: ".unsortable",
        tolerance: "pointer",
        helper: "clone",
        forcePlaceholderSize: true
      })
      .disableSelection();

    $(data).sortable("refresh");

    $(data)
      .find(".list-group-item")
      .each(function(index) {
        if ($(this).data("index") === undefined) {
          $(this).data("index", index);
          $(this)
            .find("a")
            .on("click", handlerFavs);
        }
      });

    changeFavsIcons();
  }
  if ($(document.body).hasClass("meus-favoritos")) {
    listFav(".listagem-meus-favoritos");
    $(".btn-save-edit").on("click", handlerEditSave);
    $(".btn-cancel").on("click", handlerCancel);
  }
});
function getFeriado(pagina) {
  var data = jQuery("#busca-feriado").serialize();

  jQuery.post(FRMAjax.ajaxurl, data, function(response) {
    response = $.parseJSON(response);

    var html = "";
    if (response.length > 0) {
      jQuery.each(response, function(chave, objeto) {
        console.log(objeto);
        html += "<tr  role='row'>";
        html += "	<td>" + objeto.data + "</td>";
        html += "	<td>" + objeto.titulo + "</td>";
        html += "	<td>" + (objeto.tipo == null ? "" : objeto.tipo) + "</td>";
        html += "</tr>";
      });
    } else {
      html += "<tr>";
      html +=
        '<td class="dataTables_empty" colspan="4" valign="top">Sem resultados</td>';
      html += "</tr>";
    }
    $(".tabela-feriados tbody").html(html);
  });

  var ano = $("[name='ano']").val();
  if (ano == "") {
    var d = new Date();
    ano = d.getFullYear();
  }

  $(".pagina-titulo span").html(ano);
}

jQuery(function() {
  if (jQuery(".page").hasClass("feriados")) {
    jQuery(".table").data("swipe-limit", 300);

    getFeriado(1);
    jQuery("#busca-feriado").submit(function(event) {
      getFeriado(1);
      return false;
    });
  }
});
$.validator.addMethod(
  "selectcheck",
  function(value, element, arg) {
    return arg != value;
  },
  "requerido"
);

function validaFormFerramenta(argument) {
  var formFerramenta = $("#form-ferramenta-calculo");

  formFerramenta.validate({
    errorContainer: ".help-block",
    errorLabelContainer: ".erros",
    errorElement: "li",
    errorClass: "invalido",
    validClass: "valido",
    highlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .addClass(errorClass)
        .removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      jQuery(element)
        .parents(".form-group")
        .removeClass(errorClass)
        .addClass(validClass);
    },
    ignore: "",
    rules: {
      processo: {
        required: true,
        minlength: 2
      },
      devedor: {
        required: true
      },
      credor: {
        required: true
      },
      indexador: {
        required: true,
        selectcheck: "Selecione"
      },
      juros: {
        required: true,
        selectcheck: "Selecione"
      },
      valor: {
        required: function(element) {
          return !$('input[name="a-combinar"]').is(":checked");
        }
      },
      "descricao-anuncio": {
        required: true,
        maxlength: 2000
      }
    },
    messages: {
      processo: {
        required: "Por favor, informe o processo",
        minlength: "Seu processo deve consistir em pelo menos 2 caracteres"
      },
      devedor: {
        required: "Por favor, informe o devedor"
      },
      credor: {
        required: "Por favor, informe o credor"
      },
      indexador: {
        required: "Por favor, selecione o indexador",
        selectcheck: "Por favor, selecione o indexador"
      },
      juros: {
        required: "Por favor, selecione os juros",
        selectcheck: "Por favor, selecione os juros"
      }
    }
  });
}

$(document).ready(function() {
  validaFormFerramenta();
});

(function(window, undefined) {
  "use strict";
  /*child hue*/
})(this);
$(function() {
  $(document).ready(function() {
    //CHECK VIDEO SUPPORT
    $("video").each(
      function(index, value) {
        var videoTag = $(value).get(0),
          videoType = $(videoTag)
            .find("source")
            .attr("type");

        if (videoTag.canPlayType(videoType) !== "") {
          //POSTER
          if (
            $(videoTag)
              .parent()
              .find(".video-poster").length > 0
          )
            $(videoTag)
              .parent()
              .find(".video-poster")
              .on("click", function(event) {
                $(event.currentTarget).fadeOut(500);
                $(event.currentTarget)
                  .parent()
                  .find("video")
                  .get(0)
                  .play();
              });
        } else {
          //REMOVE PLAY ICON
          if (
            $(videoTag)
              .parent()
              .find(".video-poster").length > 0
          ) {
            $(videoTag)
              .parent()
              .find(".video-poster")
              .addClass("video-poster-disable");
            $(videoTag)
              .parent()
              .find(".image-poster")
              .addClass("play-disable");
          }

          // $( videoTag ).parent().find( ".image-poster" ).remove();
        }
        $(videoTag).on("error", function() {
          console.log("ERROR");
          if (
            $(videoTag)
              .parent()
              .find(".video-poster").length > 0
          ) {
            $(videoTag)
              .parent()
              .find(".video-poster")
              .addClass("video-poster-disable");
            $(videoTag)
              .parent()
              .find(".image-poster")
              .addClass("play-disable");
          }
        });
      }.bind(this)
    );
    $(".info-container .image img").each(function() {
      $(this)
        .on("load", function() {
          $(this)
            .parent()
            .removeClass("loading");
        })
        .trigger("load");
    });
  });

  if ($(".gallery-content").length > 0) {
    function Gallery(container) {
      var orientation = "",
        _scope = this,
        canResizeGallery = false,
        xsWidth = 992,
        infoList = container.find(".info-container"),
        scrollContainer = container.find(".listagem"),
        thumbContainer = container.find(".thumbs-container"),
        thumbList = container.find(".thumb-list"),
        arrows = container.find(".slick-arrow");

      this.type = "";
      this.length = 0;
      this.animating = false;
      this.actualIndex = -1;

      this.init = function() {
        this.length = thumbList.find(".thumb-item").length;
        this.type = container.hasClass("glr-video") ? "video" : "image";

        infoList.removeClass("loading");

        //SET ITEM INDEX
        $(thumbList)
          .find(".thumb-item")
          .each(function(index, value) {
            $(this).data("index", index);
          });
        //ITEM
        $(thumbList)
          .find(".thumb-item")
          .on("click", this.handlerItem.bind(this));
        //ARROWS
        $(arrows)
          .on("click", this.handlerArrow.bind(this))
          .fadeIn(500);

        if (this.type === "image") {
          container.find(".info-container img").each(function() {
            var newImage = document.createElement("img");

            $(this).on("load", function() {
              canResizeGallery = true;
              $(window).trigger("resize");
            });
            newImage.src = $(this).attr("src");
          });
        }

        $(window).trigger("resize");
        this.set(0);
      };

      this.set = function(newIndex) {
        if (
          infoList
            .find(".item-info")
            .eq(newIndex)
            .hasClass("active")
        )
          return;

        if (this.animating) return;
        this.animating = true;

        var oldInfo = infoList.find(".active"),
          nextInfo = infoList.find(".item-info").eq(newIndex);

        if (this.type === "video") {
          if (oldInfo.find("video").length > 0) {
            oldInfo
              .find("video")
              .get(0)
              .pause();
          }
        }

        thumbList.find(".active").removeClass("active");

        nextInfo
          .css("z-index", "1")
          .addClass("active")
          .fadeIn(
            300,
            function() {
              oldInfo.removeClass("active").fadeOut(0);
              $(nextInfo).css("z-index", "");

              this.actualIndex = newIndex;
              this.animating = false;
            }.bind(this)
          );

        //if ( canResizeGallery ) _scope.resizeGallery();

        thumbList
          .find(".thumb-item")
          .eq(newIndex)
          .addClass("active");
      };

      this.resizeGallery = function() {
        if (this.type !== "image") return;

        container.find(".info-container img").each(function() {
          $(this).removeAttr("style");
          if ($(this).width() === 0) return;
          var sizeImage = _scope.resizeImage(
            $(this).width(),
            $(this).height(),
            $(this)
              .parent()
              .outerWidth(),
            $(this)
              .parent()
              .outerHeight()
          );

          $(this)
            .css("width", sizeImage.width)
            .css("height", sizeImage.height)
            .css("top", sizeImage.y)
            .css("left", sizeImage.x);
        });
      };

      this.resizeImage = function(startW, startH, finalW, finalH) {
        //Define starting width and height values for the original image
        console.log(startW, startH, finalW, finalH);
        var startwidth = startW,
          startheight = startH,
          ratio = startheight / startwidth,
          browserwidth = finalW,
          browserheight = finalH,
          finalWidth,
          finalHeight,
          finalX,
          finalY;

        if (browserheight / browserwidth > ratio) {
          finalHeight = browserheight;
          finalWidth = browserheight / ratio;
        } else {
          finalWidth = browserwidth;
          finalHeight = browserwidth * ratio;
        }

        return {
          width: finalWidth,
          height: finalHeight,
          x: (browserwidth - finalWidth) / 2,
          y: (browserheight - finalHeight) / 2
        };
      };

      this.handlerItem = function(event) {
        var index = $(event.currentTarget).data("index");
        event.preventDefault();

        if (index === this.actualIndex) return;

        this.set(index);
      };
      this.handlerArrow = function(event) {
        event.preventDefault();
        var newIndex = this.actualIndex;

        if ($(event.currentTarget).hasClass("slick-prev")) {
          newIndex--;

          if (newIndex < 0) newIndex = this.length - 1;
        } else {
          newIndex++;

          if (newIndex >= this.length) newIndex = 0;
        }

        this.set(newIndex);
      };

      $(window).on("resize", function(event) {
        var pageWidth = $(event.currentTarget).width();

        if (
          pageWidth < xsWidth &&
          (orientation === "vertical" || orientation === "")
        ) {
          orientation = "horizontal";
          scrollContainer.tinyscrollbar({
            axis: "x",
            wheelLock: false
          });
        }
        if (
          pageWidth >= xsWidth &&
          (orientation === "horizontal" || orientation === "")
        ) {
          orientation = "vertical";
          scrollContainer.tinyscrollbar({
            axis: "y",
            wheelLock: false
          });
        }

        //if ( canResizeGallery ) _scope.resizeGallery();
      });

      //
      this.init.call(this);
    }

    $(".gallery-content").each(function() {
      new Gallery($(this));
    });
  }
});
$(function() {
  // em_setup_timepicker = function(str) {
  // 	return '';
  // };
  $(".em-time-start, .em-time-end").mask("99:99");

  // $(".em-time-start").change(function(){
  //        var isValid = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(this);

  //        if (isValid) {
  //            $(this).style.backgroundColor = '#bfa';
  //        } else {
  //            $(this).style.backgroundColor = '#fba';
  //        }

  //        return isValid;
  //    });

  $(".em-date-start, .em-date-end").change(function() {
    var val = $(this)
      .val()
      .trim();

    if (val.length == 10) {
      var ano = val.substr(6, 4);
      var mes = val.substr(3, 2);
      var dia = val.substr(0, 2);

      var data_formatada = ano + "-" + mes + "-" + dia;
      if ($(this).hasClass("em-date-start"))
        $('input[name="event_start_date"]').val(data_formatada);
      else $('input[name="event_end_date"]').val(data_formatada);
    }
  });
  /*
	//Manual Booking
	$('#evento-comparecer').change(function(e){
		e.preventDefault();
		var button = $(this).find('option:selected');
		// if( button.text() != EM.bb_booked && $(this).text() != EM.bb_booking){
		// 	button.text(EM.bb_booking);
			var button_data = button.data('id').split('_'); 
			$.ajax({
				url: EM.ajaxurl,
				dataType: 'jsonp',
				data: {
					event_id : button_data[1],
					_wpnonce : button_data[2],
					action : 'booking_add_one'
				},
				success : function(response, statusText, xhr, $form) {
					if(response.result){
						button.text(EM.bb_booked);
					}else{
						button.text(EM.bb_error);					
					}
					if(response.message != '') alert(response.message);
				},
				error : function(){ button.text(EM.bb_error); }
			});
		// }
		return false;
	});	
	$('a.em-cancel-button').click(function(e){
		e.preventDefault();
		var button = $(this);
		if( button.text() != EM.bb_cancelled && button.text() != EM.bb_canceling){
			button.text(EM.bb_canceling);
			var button_data = button.attr('id').split('_'); 
			$.ajax({
				url: EM.ajaxurl,
				dataType: 'jsonp',
				data: {
					booking_id : button_data[1],
					_wpnonce : button_data[2],
					action : 'booking_cancel'
				},
				success : function(response, statusText, xhr, $form) {
					if(response.result){
						button.text(EM.bb_cancelled);
					}else{
						button.text(EM.bb_cancel_error);
					}
				},
				error : function(){ button.text(EM.bb_cancel_error); }
			});
		}
		return false;
	});  
*/
});
$("#invite-anyone-member-list li").click(function() {
  verificaSeTemConvite();
});

$("#invite-anyone-invite-list .remove").click(function() {
  verificaSeTemConvite();
});

$(".grupos .leave-group").click(function() {
  var r = confirm("Você deseja realmente sair deste grupo?");
  if (r == true) {
    return true;
  } else {
    return false;
  }
});

$(".groups .alert button.close").click(function(e) {
  var data = { alert_id: $(this).attr("alert-id"), action: "fechaAlertaGrupo" };
  jQuery.post(FRMAjax.ajaxurl, data, function(response) {
    console.log(response);
  });
});

function verificaSeTemConvite() {
  setTimeout(function() {
    var botao = $("#send-invite-form input[type='submit']");
    if (botao.is(":disabled")) {
      $(".convite-enviado").hide();
    } else {
      $(".convite-enviado").show();
    }
  }, 1500);
}

var mansoryGroups;
if ($("#activity-stream").length > 0) {
  if ($(document.body).hasClass("group-home")) {
    mansoryGroups = $("#activity-stream").masonry({
      itemSelector: ".grid-item"
    });

    $("#activity-stream")
      .find("img")
      .each(function() {
        loadImageMansory($(this).attr("src"));
      });
  }

  $("#activity-stream").on("click", ".ac-reply-cancel", function(event) {
    event.preventDefault();
    $(this)
      .parent()
      .find(".bp-suggestions")
      .val("")
      .trigger("keyup");
  });
}

function loadImageMansory(src) {
  var newImgElem = document.createElement("img");

  $(newImgElem).on("load", function() {
    mansoryGroups.masonry("layout");
  });

  newImgElem.src = src;
}
var likesPendentes = [];
var likesEmAndamento = false;
if ($(document.body).is(".groups, .single-event, .single-item")) {
  if ($(".bp-suggestions").length > 0) {
    $("#activity-stream, .activity-comments").on(
      "keyup",
      ".bp-suggestions",
      function(event) {
        var textField = $(this).val();

        if (textField === "") {
          $(this)
            .parent()
            .parent()
            .find(".ac-reply-submit")
            .hide();
          $(this)
            .parent()
            .parent()
            .find(".ac-reply-cancel")
            .hide();

          if (mansoryGroups) mansoryGroups.masonry("layout");
        } else {
          $(this)
            .parent()
            .parent()
            .find(".ac-reply-submit")
            .show();
          $(this)
            .parent()
            .parent()
            .find(".ac-reply-cancel")
            .show();

          if (mansoryGroups) mansoryGroups.masonry("layout");
        }
      }
    );
  }
  $(".ac-reply-cancel").click(function(e) {
    e.preventDefault();

    $(
      "#activity-stream, .activity-comments .ac-reply-content .bp-suggestions"
    ).val("");
    $("#activity-stream, .activity-comments .ac-reply-content")
      .find(".ac-reply-submit")
      .hide();
    $("#activity-stream, .activity-comments .ac-reply-content")
      .find(".ac-reply-cancel")
      .hide();
  });

  $("#activity-stream").on("click", ".notification", function(event) {
    var esse = jQuery(this);
    var data = {
      activity_id: $(this).attr("data-activity"),
      ativar: $(this).attr("data-tipo"),
      action: "ativarNotification"
    };
    var response = "";
    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      esse.children().toggleClass("fa-bell-slash");
      esse.children().toggleClass("fa-bell");
      esse.toggleClass("without");
    });
  });
  function processaPendentes() {
    if (likesPendentes.length > 0) {
      console.log(likesPendentes.length);
      likesEmAndamento = true;
      var esse = likesPendentes.shift();

      var html = '<span class="fa fa-thumbs-up"></span>';

      $.ajax({
        type: "POST",
        url: esse.attr("href"),
        dataType: "json",
        success: function(data) {
          var total = data.total;
          if (data.user_favorite) {
            html = html + "Você";
            total--;
            if (total > 0) {
              html =
                html + ' + <span class="text-fav">' + total + " membros</span>";
            }
          } else {
            html = html + '<span class="text-fav">' + total + " membros</span>";
          }

          esse.html(html);
          esse.attr("href", data.link);
          esse.removeAttr("disabled");
          processaPendentes();
        },
        error: function(erro) {
          console.log(erro);
        }
      });
    } else {
      likesEmAndamento = false;
    }
  }
  $("#activity-stream, .button-list-activity").on(
    "click",
    ".unfav,.fav",
    function(event) {
      var esse = jQuery(this);
      likesPendentes.push(esse);
      esse.attr("disabled", "true");
      if (!likesEmAndamento) {
        processaPendentes();
      }

      return false;
    }
  );

  $(".ac-reply-submit").click(function(event) {
    event.preventDefault();
    $(this).prepend('<span class="fa fa-refresh"></span>');
    $(this).addClass("loading-news");
    $(this).prop("disabled", true);

    $(this)
      .closest("form")[0]
      .submit();
  });

  $("#carregar-mais-meus-grupos").click(function() {
    $(this).addClass("loading-news");
    $(this).attr("disabled", "true");

    var data = { page: jQuery(this).attr("data-page"), action: "meusGrupos" };

    jQuery(this).attr(
      "data-page",
      parseInt(jQuery(this).attr("data-page")) + 1
    );

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      htmlListagrupos(
        response,
        $("#list-meus-grupos"),
        $("#carregar-mais-meus-grupos")
      );
    });
  });
  $("#carregar-mais-descobrir-grupos").click(function() {
    $(this).addClass("loading-news");
    $(this).attr("disabled", "true");
    var data = {
      page: jQuery(this).attr("data-page"),
      action: "descubraGrupos"
    };

    jQuery(this).attr(
      "data-page",
      parseInt(jQuery(this).attr("data-page")) + 1
    );

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      htmlListagrupos(
        response,
        $("#list-descubra-grupos"),
        $("#carregar-mais-descobrir-grupos")
      );
    });
  });
}
function htmlListagrupos(response, content, botao) {
  var html = "";
  response = $.parseJSON(response);
  botao.removeClass("loading-news");
  botao.removeAttr("disabled");
  if (!response.carregar_mais) {
    botao.hide();
  }
  if (response.grupos.length > 0) {
    $.each(response.grupos, function(index, value) {
      html +=
        '<div id="groups-list'+Math.random()+'" class="col-xs-6 col-sm-3 col-lg-2 grid-fluid">';
      html += "	<div " + value.class + ">";
      html +=
        '		<a class="list-group-item item-normal" href="' + value.link + '">';
      html += value.avatar;
      html += '			<div class="conteudo-news">';
      html += '				<span class="news-title">' + value.name + "</span>";
      html += '				<span class="campanha-comarcas">';
      html +=
        '					<span class="comarca-item"><span class="fa fa-' +
        value.icone +
        '" ></span> ' +
        value.tipo +
        "</span>";
      html += '					<span class="comarca-item">' + value.membros + "</span>";
      html += '					<span class="comarca-item">' + value.posts + "</span>";
      html += "				</span>";
      if (value.botao) {
        html += value.botao;
      }
      html += "			</div>";
      html += "		</a>";
      html += "	</div>";
      html += "</div>";
      html += "";
    });
  }

  content.append(html);
}
$(document).ready(function() {
  verificaSeTemConvite();
  jQuery(".checkSetAdmin").on("change", function() {
    var pai = jQuery(this)
      .parent()
      .parent();
    var admin = jQuery(this).is(":checked");
    var data = {
      group_id: jQuery(this).attr("data-group"),
      user_id: jQuery(this).attr("data-user"),
      value: admin,
      action: "definirAdmin"
    };
    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      if (admin) {
        pai
          .find(".list-informacoes")
          .append(
            '<p class="participante-item admin"><span class="fa fa-group  icone"></span> Administrador</p>'
          );
      } else {
        pai.find(".participante-item.admin").remove();
      }
    });
  });
  $(".load-more a").click(function() {
    var top = $("#activity-stream li:last").offset().top;
    console.log(" ULTIMA LI", top);
    var page = $(this).attr("data-page");
    page++;
    $(this).fadeOut();
    var data = { action: "paginarGrupos", acpage: page };
    $(this).attr("data-page", page);

    jQuery.ajax({
      method: "POST",
      url: FRMAjax.ajaxurl,
      data: data,
      success: function(retorno) {
        retorno = $.parseJSON(retorno);
        $("#activity-stream").append(retorno.html);

        mansoryGroups.masonry("destroy");
        mansoryGroups = $("#activity-stream").masonry({
          itemSelector: ".grid-item"
        });

        $("#activity-stream")
          .find("img")
          .each(function() {
            loadImageMansory($(this).attr("src"));
          });
        if (retorno.more_items) {
          $(".load-more a").fadeIn();
        }
        $("html, body").animate(
          {
            scrollTop: top
          },
          500
        );
      }
    });
    return false;
  });
});
if (
  $(document.body).hasClass("grupos-eventos") &&
  $(document.body).hasClass("my-events")
) {
  $("input#event-image").on("change", function(event) {
    $("#event-image-img").hide();
    var target = event.currentTarget;
    $(".archive-name").remove();
    $(".box-upload-eventos").append(
      "<span class='archive-name'>" + target.files[0].name + "</span>"
    );
  });
}

function AjustaSelects() {
  /*
	$('.selectpicker').each(function()
	{
		if (!$(this).hasClass("logar") && $(this).eq(0).name == 'domain' )
		{
			$(this).selectpicker({
				container: 'body'
			});
		}
	});
	*/

  $("#form-widget-restaurante .selectpicker").selectpicker("refresh");

  $(".select-dominio-login").selectpicker("show");

  // ajusta a função de fechar do DDL após o clique
  $("body").on("click", "ul.dropdown-menu.inner li a", function() {
    $(this)
      .parent()
      .parent()
      .parent()
      .parent()
      .removeClass("open");
  });

  //alert('teste');
}

function banner() {
  var $slider = new DefaultSlider({
    container: "#banner",
    options: {
      accessibility: true,
      infinite: true,
      slidesToShow: 1,
      autoplay: true,
      autoplaySpeed: 6000,
      dots: true,
      fade: true,
      pauseOnHover: false,
      arrows: false,
      appendDots: $("#controls-banner"),
      mobileFirst: true
    }
  });
}

function bannerNoticias() {
  var $sliderNoticias = new DefaultSlider({
    container: "#banner-noticias",
    options: {
      accessibility: true,
      infinite: true,
      slidesToShow: 1,
      autoplay: true,
      autoplaySpeed: 6000,
      dots: true,
      fade: true,
      pauseOnHover: false,
      arrows: true,
      appendDots: $("#controls-noticias")
    }
  });
}
var $sliderCardapio,
  $sliderCardapioHeader,
  optionsSliderCardapio = {
    accessibility: true,
    infinite: true,
    slidesToShow: 1,
    autoplay: false,
    dots: false,
    fade: true,
    pauseOnHover: false,
    arrows: true,
    asNavFor:
      ".panel-restaurantes .list-cardapio, .panel-restaurantes .data, .panel-mob-restaurantes .list-cardapio, .panel-mob-restaurantes .data",
    prevArrow: ".widget-cardapio .group-navegacao .btn-prev",
    nextArrow: ".widget-cardapio .group-navegacao .btn-next"
  };

function sliderCardapio() {
  if (typeof $sliderCardapio == "undefined") {
    var firstTimeMobRestaurantes = true;

    $sliderCardapio = new DefaultSlider({
      container:
        ".panel-restaurantes .list-cardapio, .panel-mob-restaurantes .list-cardapio",
      options: optionsSliderCardapio
    });
    $sliderCardapioHeader = new DefaultSlider({
      container: ".panel-restaurantes .data, .panel-mob-restaurantes .data",
      options: optionsSliderCardapio
    });

    $("body").on("click", ".btn-mob-restaurantes", function() {
      if (!firstTimeMobRestaurantes) return;
      setTimeout(function() {
        $sliderCardapio.update();
        $sliderCardapioHeader.update();
      }, 100);
      firstTimeMobRestaurantes = false;
    });

    cardapioToolbarContent();
  } else {
    $sliderCardapio.update();
    $sliderCardapioHeader.update();
  }
}

function clearRestaurantes() {
  if ($sliderCardapio == "undefined") return;
  if ($(".widget-cardapio .list-cardapio").find(".slick-slide").length > 0) {
    $sliderCardapio.removeItem(0);
    $sliderCardapioHeader.removeItem(0);

    clearRestaurantes();
  }
}

function cardapioToolbarContent() {
  /*$(".bloco-texto-infos").on( "mouseenter", function (argument) {
		$( event.currentTarget ).find(".tool").stop(true).animate({opacity:1, left: "-208px"}, 300).css("display", "block");
	} );
	$(".bloco-texto-infos").on( "mouseleave", function (argument) {
		$( event.currentTarget ).find(".tool").stop(true).animate({opacity:0, left: "-200px"}, 300, function (argument) {
			$(this).css("display", "");
		});
	} );*/
}

function widgetCardapio() {
  $("body").on(
    "change",
    "#form-widget-restaurante #selWidgetCardapio, #form-widget-restaurante #selWidgetCardapioMobile",
    function() {
      // alert($(this).attr('id'));
      $(".widget-cardapio .list-cardapio").fadeOut("fast", function() {
        clearRestaurantes();
        $(".widget-cardapio .loader").fadeIn();
      });
      var data = { id: $(this).val(), action: "widgetCardapio" };
      var response = "";

      jQuery.post(
        FRMAjax.ajaxurl,
        //jQuery.post(FRMAjax.ajaxurlv2,
        data,
        function(response) {
          response = $.parseJSON(response);
          var lista = "";
          var cabecalho = "";
          var data;
          $.each(response, function(key, value) {
            data = key.split("-");
            data = data.reverse();
            data = data.join("/");

            cabecalho = '<span class="texto">' + data + "</span>";
            lista = "<div>";
            if (typeof value.cardapio != "undefined") {
              lista +=
                "<div class='bloco-texto-infos'> <div class='tool'>" +
                value.cardapio +
                "</div> <div class='overflow'>" +
                value.cardapio +
                "<p>&nbsp;</p></div></div>";
            } else {
              lista += "Não há informações cadastradas para a data informada.";
            }
            lista += "</div>";

            $sliderCardapio.addItem(lista);
            $sliderCardapioHeader.addItem(cabecalho);
          });

          $(".widget-cardapio .loader").fadeOut("fast", function() {
            $(".widget-cardapio .list-cardapio").fadeIn();
            sliderCardapio();
          });

          cardapioToolbarContent();
        }
      );
    }
  );

  $("#form-widget-restaurante #selWidgetCardapioMobile").trigger("change");
}

function widgetClassificados() {
  // widget-classificados
  var widgetClassificadosSlickDesktop = {
    slidesToShow: 2,
    slidesToScroll: 2,
    accessibility: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 6000,
    dots: true,
    // fade: true,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  var widgetClassificadosSlick = {
    slidesToShow: 1,
    slidesToScroll: 1,
    accessibility: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 6000,
    dots: true,
    // fade: true,
    pauseOnHover: true,
    arrows: false
  };

  widgetClassificadosSlickDesktop.appendDots = $(
    "#controls-classificados-desktop"
  );
  widgetClassificadosSlick.appendDots = $("#controls-classificados-");

  slickWidgetHomeDesk = new DefaultSlider({
    container: ".slide-classificados-widget-desktop",
    options: widgetClassificadosSlickDesktop
  });

  var slickWidgetHomeMob = new DefaultSlider({
    container: ".slide-classificados-widget-",
    options: widgetClassificadosSlick
  });

  var timeoutBotaoClassificados;
  $("body").on("click", ".btn-mob-classificados", function(event) {
    /*
			QUANDO ESSE EVENTO É DISPARADO A CLASSE "collapsed" AINDA NÃO FOI ADICIONADA/REMOVIDA,
			SENDO ASSIM A VERIFICAÇÃO OCORRE AO CONTRARIO
			*/
    if ($(event.currentTarget).hasClass("collapsed")) {
      clearTimeout(timeoutBotaoClassificados);
      timeoutBotaoClassificados = setTimeout(function() {
        slickWidgetHomeMob.setPosition();
      }, 50);
    }
  });

  // end widget-classificados
}

function CarregarAlertasTopo(colecaoAlerta) {
  //alert('to no Alertas do Topo');
  var data = { action: "carregarAlertasTopoUsuarioLogado" };
  var response = "";

  jQuery.post(
    FRMAjax.ajaxurlv2,
    //jQuery.post(FRMAjax.ajaxurl,
    data,
    function(response) {
      var partes = response.split("|||");

      $("#divPrevAlertasTopo").after(partes[0]);
      $("#divPrevAlertasTopo").remove();

      var formLogin = partes[1];
      //alert(formLogin);

      if (formLogin != "") {
        $(".lista-login-topo")
          .html(formLogin)
          .next()
          .hide();
      } else {
        $(".lista-drop-login")
          .children(".dropdown-menu")
          .css("display", "");
      }

      $("#redirect_to").val(location.href);

      AjustaSelects();

      alertaContainerSlider = new DefaultSlider({
        container: ".alerta .container",
        options: {
          prevArrow: ".prev-alert",
          nextArrow: ".next-alert",
          infinite: true,
          speed: 500,
          fade: true,
          cssEase: "linear"
        }
      });

      //if (usuarioLogado)
      //{

      // verifica os alertas emergenciais
      CarregarAlertas(colecaoAlerta);
      //}

      setTimeout(setIntexWarning, 500);
    }
  );
}

function CarregarAlertas(colecaoAlerta) {
  //alert('to no ColecaoAlerta');

  var $tem_alerta = "";
  if (colecaoAlerta.length > 0) {
    //alert(colecaoAlerta.length);

    $tem_alerta = "sim";

    var $html = "";
    for (var x = 0; x < colecaoAlerta.length; x++) {
      var $alerta = colecaoAlerta[x];

      $html +=
        '<div id="modal-alerta' +
        $alerta.ID +
        '" class="modal modal-alerta fade" tabindex="-1" role="dialog">';
      $html += '	<div class="modal-dialog" role="document">';
      $html += '		<div class="modal-content">';
      $html +=
        '			<button type="button" class="close fa fa-times" data-dismiss="modal" data-id="' +
        $alerta.ID +
        '"></button>';
      $html += '			<div class="modal-header">';
      $html += '				<div class="modal-title">' + $alerta.titulo + "</div>";
      $html += "			</div>";
      $html += '			<div class="modal-body content">';
      $html += '				<span class="icone fa fa-bell"></span>';
      $html += "				<p>";
      $html += "					" + $alerta.conteudo + "";
      $html += "				</p>";
      $html +=
        '				<button type="button" class="btn btn-primary btn-estou-ciente" data-id="' +
        $alerta.ID +
        '" data-dismiss="modal">Estou Ciente</button>';
      $html += "			</div>";
      $html += "		</div>";
      $html += "	</div>";
      $html +=
        '	<button type="button" class="btn btn-alerta hide ' +
        $tem_alerta +
        '" data-id="' +
        $alerta.ID +
        '" data-toggle="modal" data-target="#modal-alerta' +
        $alerta.ID +
        '" data-backdrop="static" data-keyboard="false">Alerta</button>';
      $html += "</div>";
    }

    //alert($("#divPrevAlertas").size());
    //alert($html);
    $("#divPrevAlertas").after($html);
    $("#divPrevAlertas").remove();

    // aqui eu abro o primeiro alerta, caso exista
    if ($(".btn-alerta:first").hasClass("sim")) {
      if (
        getCookie("avisos").indexOf($(".btn-alerta:first").data("id")) == -1
      ) {
        //alert('clicando pra mostrar');
        $(".btn-alerta:first").trigger("click");
      }
    }

    alertaContainerSlider.update();
  }
}

function CarregarMinhasNoticias(colecaoMinhasNoticias) {
  // mostra a aba "Minhas Notícias"
  $(".aba-minhas-noticias").show();
  //$('#minhas-noticias').show();

  if (colecaoMinhasNoticias.length == 0) {
    $("#minhas-noticias .conteudo .list-news").html(
      "Nenhuma notícia disponível."
    );
  } else {
    var $html = "";
    for (var x = 0; x < colecaoMinhasNoticias.length; x++) {
      $not = colecaoMinhasNoticias[x];

      $html +=
        '<a href="' + $not.noticia_link + '" class="list-group-item clearfix">';

      if ($not.noticia_imagem && $not.noticia_imagem != "") {
        $html += '		<span class="foto">';
        $html +=
          '			<img src="' +
          $not.noticia_imagem[0] +
          '" alt="' +
          $not.noticia_titulo +
          '" />';
        $html += "		</span>";
      }

      $html += '	<span class="conteudo-news">';
      $html += '		<span class="data">' + $not.noticia_data + "</span>";
      $html += "		" + $not.noticia_titulo + "";
      $html += "	</span>";
      $html += "</a>";
    }

    $("#minhas-noticias .conteudo .list-news").html($html);
    $("#tab-minhas-noticias").show();
  }
}

function CarregarSistemasNotificacoesUsuario() {
  var data = { action: "CarregarSistemasUsuario" };
  var response = "";

  jQuery.post(FRMAjax.ajaxurlv2, data, function(response) {
    //alert(response);
    var partes = response.split("|||");
    // Meus Sistemas Mobile
    $("#menu-sistema .menu-content .list-group.sistemas")
      .html("")
      .html(partes[0]);

    // Meus Sistema Desktop
    $(".lista.lista-sistemas-topo .dropdown-menu")
      .html("")
      .html(partes[1]);

    // Meu TJ Mobile
    $("#menu-meu-tj").html(partes[2]);

    // filtros de busca de sentenças
    $(".filtro-sentencas").show();

    if (location.pathname.search("busca/") != -1) {
      $(".nav-tab-hide").hide();
    }

    // Menu Meu TJ
    if (partes[3] != "") {
      $(".lista.keep-open.meu-tj").html(partes[3]);
    }

    $(".notificacoes-topo")
      .show()
      .html(partes[4]);

    //alert('antes1');
    AjustaSelects();
    //AjustaSelects();
  });
}

function CarregarTopo(usuario) {
  $("#link-login").text(usuario.display_name);

  CarregarSistemasNotificacoesUsuario();
}

function CarregarWidgets() {
  if ($("#botao-personalizar").size() > 0) {
    $("#botao-personalizar").show();

    var data = { action: "CarregarWidgetsUsuario" };
    var response = "";

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      var partes = response.split("|||");
      $("#div-widgets-1").html(partes[0]);

      $("#div-widgets-2").html(partes[1]);

      // gerenciamento dos widgets
      $(partes[2]).insertBefore("#divPrevAlertas");
      // declara os sortables da personalização dos widgets
      personalizarCapa();

      AjustaSelects();

      // binda os eventos do widget de cardápio
      sliderCardapio();
      widgetCardapio();
      widgetClassificados();
      mais_acessados();
    });
  }
}

var loadHome = false;
var logado = false;
jQuery(document).ready(function(){
  jQuery("*[data-publico='interno']").each(function(e) {
    jQuery(this).hide();
  });
  jQuery("*[data-publico='externo']").each(function(e) {
    jQuery(this).hide();
  });
});
function mais_acessados() {
  if (!$logado) {
    jQuery("*[data-publico='interno']").each(function(e) {
      jQuery(this).remove();
    });
    jQuery("*[data-publico='externo']").each(function(e) {
      jQuery(this).show();
    });
  } else {
    jQuery("*[data-publico='externo']").each(function(e) {
      jQuery(this).remove();
    });
    jQuery("*[data-publico='interno']").each(function(e) {
      jQuery(this).show();
    });
  }
  jQuery("#widget-mais-acessados > .panel > .panel-body").show();
  //jQuery('#loading_widget_mais_acessados').remove();
}

function LoadHome() {
  $loadHome = true;

  var publico = $("meta[name='publico']").attr("content");

  // se a página é pública, já exibe o conteúdo
  if (publico != "interno") {
    $("#conteudo-page").show();
    $(".loader-publico").hide();
  }

  var data = { action: "verificarUsuarioLogado" };
  var response = "";

  $(".destaque-secundario-slider").slick({
    //centerMode: true,
    arrows: true,
    dots: true,
    infinite: true,
    speed: 300,
    slidesToShow: 4,
    slidesToScroll: 4,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          infinite: true,
          dots: true
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: false
        }
      }
      // You can unslick at a given breakpoint now by adding:
      // settings: "unslick"
      // instead of a settings object
    ]
  });

  jQuery.post(FRMAjax.ajaxurlv2, data, function(response) {
    response = $.parseJSON(response);
    $logado = response.logado;
    //Remove os elementos marcados como publico interno para usuarios deslogados
    mais_acessados();
    function get_url_parameter(name, url) {
      if (!url) url = location.href;
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regexS = "[\\?&]" + name + "=([^&#]*)";
      var regex = new RegExp(regexS);
      var results = regex.exec(url);
      return results == null ? null : results[1];
    }
    var login = get_url_parameter("login", window.location.href);
    //Todos os usuário não logados E acessando da rede interna deverão se logar
    if (!response.logado && response.acessoRedeInterna && login == "S") {
      location.href = "admin/wp-login.php?redirect_to=" + window.location.href;
      return;
    } else {
      // se a página é pública, já exibe o conteúdo
      if (publico != "interno") {
        $("#conteudo-page").show();
        $(".loader-publico").hide();
      }
    }

    //se a página não é publica, verifica se o usuário está logado ou não
    // se estiver logado, exibe o conteúdo
    // se não estiver logado, direciona para a tela de login
    if (publico == "interno") {
      if ($logado) {
        $("#conteudo-page").show();
        $(".loader-publico").hide();
      } else {
        location.href = $("#url_login_tema").val();
      }
    }

    // carrega os alertas informacionais, independente de o usuário estar logado ou não
    CarregarAlertasTopo(response.colecaoAlerta);

    // Se o usuário está logado
    if (response.logado) {
      // Carrega toda a barra do topo do usuário
      CarregarTopo(response.usuario);

      // mostra o botão de personalizar a home
      $(".div-personalizar").show();

      // Notícias do usuário
      CarregarMinhasNoticias(response.colecaoMinhasNoticias);

      // Widgets
      CarregarWidgets();

      $("li.menu-item-escondido")
        .show()
        .removeClass("menu-item-escondido");
      fixSubmenu(true);
    } else {
      sliderCardapio();
      widgetCardapio();
    }

    // Carrega os eventos dos sliders
    banner();
    bannerNoticias();
  });
}

$(document).ready(function() {
  LoadHome();
});

$(function() {
  //SalvarContadorVisualizacao();
  if (
    $("#id_justicagauchanatv").size() > 0 &&
    $("#id_justicagauchanatv").val() != ""
  ) {
    var dados = {
      id: $("#id_justicagauchanatv").val(),
      action: "SalvarContadorVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {}
    });
  }

  //ObterTotalVisualizacao();
  if (
    $("#total_views").size() > 0 &&
    $("#id_justicagauchanatv").size() > 0 &&
    $("#id_justicagauchanatv").val() != ""
  ) {
    var dados = {
      id: $("#id_justicagauchanatv").val(),
      action: "ObterTotalVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {
        $("#total_views")
          .html('<span class="fa fa-eye"></span> ' + resposta)
          .show();
      }
    });
  }

  if ($(".page").hasClass("justica-gaucha-na-tv")) {
    no_data = $(".justica-gaucha-na-tv #justica-gaucha-na-tv-sem-dados");
    var data = $("#form-justica-gaucha-na-tv").serializeArray();
    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      if (response == "") {
        no_data.show();
      }
      $("#justica-gaucha-na-tv-container").html(response); // retorno html montato da funcao getjustica-gaucha-na-tv
    });
    $(".justica-gaucha-na-tv .search-container .btn-search").click(function(e) {
      e.preventDefault();

      // elementos da caixa de pesquisa
      assunto = $(
        '.justica-gaucha-na-tv .search-container input[name="assunto"]'
      ).val();
      data_inicial = $(
        '.justica-gaucha-na-tv .search-container input[name="data_inicial"]'
      ).val();
      data_final = $(
        '.justica-gaucha-na-tv .search-container input[name="data_final"]'
      ).val();
      no_data = $(".justica-gaucha-na-tv #justica-gaucha-na-tv-sem-dados");

      // carrega elementos form de resultado da tpl-justica-gaucha-na-tv-listagem
      // no clique do form de pesquisa
      $('#form-justica-gaucha-na-tv input[name="page"]').val(1);
      $('#form-justica-gaucha-na-tv input[name="assunto"]').val(assunto);
      $('#form-justica-gaucha-na-tv input[name="data_inicial"]').val(
        data_inicial
      );
      $('#form-justica-gaucha-na-tv input[name="data_final"]').val(data_final);

      // serializa o form da lisagem de resultado e envia
      // para método getJusticaGauchaNaTV da justica-gaucha-na-tv-helper via ajax
      var data = $("#form-justica-gaucha-na-tv").serializeArray();
      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        if (response == "") {
          no_data.show();
        }
        $("#justica-gaucha-na-tv-container").html(response); // retorno html montato da funcao getjustica-gaucha-na-tv
      });
    });

    //MORE ITENS
    $(".btn-more-news").on("click", function() {
      $(this).addClass("loading-news");

      setTimeout(function() {
        $(".btn-more-news").removeClass("loading-news");
      }, 2000);
    });
  }
});
$(function() {
  $(".landing .agrupador-sub-links").each(function() {
    $(this).css({ marginTop: -($(this).outerHeight(true) / 2) });
  });

  if (!$("body").is(".is-mobile")) {
    $(".landing .panel a.tem-filhos").click(function() {
      if (
        !$(this)
          .parents(".item")
          .is(".aberto")
      ) {
        $(".lista-links .aberto").removeClass("aberto");
        $(".lista-links .selecionado").removeClass("selecionado");
        $(this)
          .parents(".item")
          .addClass("aberto");
      } else
        $(this)
          .parents(".item")
          .removeClass("aberto");

      return false;
    });
  } else {
    $(".landing .panel a.tem-filhos").click(function() {
      $(this)
        .parents(".lista-links")
        .addClass("aberto abertoMobile");
      $(this)
        .parents(".item")
        .addClass("selecionado");

      return false;
    });

    $(".agrupador-sub-links h4").click(function() {
      $(this)
        .parents(".lista-links")
        .removeClass("aberto abertoMobile");
      $(this)
        .parents(".item")
        .removeClass("selecionado");

      return false;
    });
  }
});
$(function() {
  if ($("body").hasClass("profile-edit")) {
    $("#profile-group-edit-submit").on("click", function(event) {
      $(this).addClass("loading-news");
    });
  }
  if ($("#message").hasClass("updated")) {
    $(".profile-edit .btn-message-success").trigger("click");
  }

  if ($("body").hasClass("change-avatar")) {
    setInterval(function() {
      newSRC = $("body.change-avatar #item-header-avatar a img").attr("src");
      $(".navbar-inner .lista-login-topo .dropdown-menu .bloco-dados img").attr(
        "src",
        newSRC
      );
    }, 1000);
  }
  if ($(".login").hasClass("page-child")) {
    $(document).ready(function() {
      setTimeout(function() {
        $(".dropdown-toggle").attr("tabindex", 1);
      }, 100);
    });
  }

  $(document.body).on("submit", "#form-login", function(event) {
    console.log("form login submit");
    $("#form-login-submit").prop("disabled", true);
    $("#form-login-submit").addClass("disabled");
    $("#form-login-submit").html("Aguarde...");
    //event.preventDefault();
    return;
  });
});
var tjNews, newsConfig;
var resultado = null;

function LimparResultado() {
  // apaga todas as divs de primeiro nível, menos a div "mais-lidas"
  $("#resultadoNoticias > div:not(.mais-lidas-fixo)").remove();
  if (tjNews) tjNews.newsGrid.masonry("layout");
}

function BuscarNoticias() {
  // ajusta a animação
  $(".btn-more-news").addClass("loading-news");

  // ajusta a página no formulário
  var pagina = parseInt($("#filtro_page").val()) + 1;
  $("#filtro_page").val(pagina);

  // se for a primeira página, apaga os itens antes da busca
  if (pagina == 1) {
    $(".mais-lidas-fixo")
      .siblings()
      .remove();

    if (!tjNews.newsGrid) {
      tjNews.newsGrid = $(".mais-lidas-fixo")
        .parent()
        .masonry({
          itemSelector: ".col-news",
          stamp: ".mais-lidas-fixo"
        });
    } else {
      $conteudo = $(".mais-lidas-fixo")
        .parent()
        .html();
      tjNews.newsGrid.masonry("appended", $conteudo);
      tjNews.newsGrid.masonry("layout");
    }
  }

  // filtro de categoria e comarca
  var filtro_categoria_comarca = "";

  //alert($('#filtro_comarca').selectpicker('val'));
  //alert($('#filtro_categoria').selectpicker('val'));

  if ($("#filtro_comarca").selectpicker("val") != "") {
    filtro_categoria_comarca +=
      "comarca:" + $("#filtro_comarca").selectpicker("val");
  }
  if ($("#filtro_categoria").selectpicker("val") != "") {
    filtro_categoria_comarca += filtro_categoria_comarca != "" ? "." : "";
    filtro_categoria_comarca +=
      "categoria:" + $("#filtro_categoria").selectpicker("val");
  }
  //alert($('#filtro_categoria').selectpicker('val'));
  // filtro de data
  var filtro_data = "";
  if (
    $("#filtro_dataInicial").val() != "" &&
    $("#filtro_dataInicial").val() != "00/00/0000"
  ) {
    var partes = $("#filtro_dataInicial")
      .val()
      .split("/");
    filtro_data += partes[2] + "-" + partes[1] + "-" + partes[0];
  }

  filtro_data += "..";

  if (
    $("#filtro_dataFinal").val() != "" &&
    $("#filtro_dataFinal").val() != "00/00/0000"
  ) {
    var partes = $("#filtro_dataFinal")
      .val()
      .split("/");

    filtro_data += partes[2] + "-" + partes[1] + "-" + partes[0];
  }

  filtro_data = "inmeta:data_publicacao:daterange:" + filtro_data;
  var itens_por_pagina = parseInt($("#filtro_view").val());
  var start = (parseInt($("#filtro_page").val()) - 1) * itens_por_pagina;
  //alert("start: " + start);

  var dados = {
    q: $("#filtro_q").val(),
    requiredfields: filtro_categoria_comarca,
    as_q: filtro_data,
    site: $("#filtro_site").val(),
    client: $("#filtro_client").val(),
    return: $("#filtro_return").val(),
    sort: $("#filtro_sort").val(),
    proxystylesheet: $("#filtro_proxystylesheet").val(),
    lr: $("#filtro_lr").val(),
    oe: $("#filtro_oe").val(),
    ie: $("#filtro_ie").val(),
    getfields: $("#filtro_getfields").val(),
    filter: $("#filtro_filter").val(),
    num: itens_por_pagina,
    start: start,
    action: "BuscarNoticias"
  };

  var response = "";
  jQuery.ajax({
    data: dados,
    url: FRMAjax.ajaxurl,
    dataType: "json",
    method: "GET",
    success: function(ret) {
      // var pagina

      //resultado = ret.gsafeed.group.record;
      resultado = ret;
      var html,
        allHtml = "";

      for (var contador = 0; contador < resultado.length; contador++) {
        html = '<div class="col-xs-12 col-sm-4 col-news clearfix">';
        html +=
          '               <a href="{URL_NOTICIA}" class="list-group-item news-item clearfix">';
        html += "                   {IMG}";
        html += '                   <span class="conteudo-news">';
        html += "                       {CATEGORIA}";
        html += "                       {DATA}";
        html += "                       {TITULO}";
        html += '                       <span class="users-stats">';
        html += "                           {VIEWS}";
        html += "                           {COMENTARIOS}";
        html += "                       </span>";
        html += "                   </span>";
        html += "               </a>";
        html += "           </div>";

        // URL
        html = html.replace("{URL_NOTICIA}", resultado[contador]["U"]);
        //console.log(resultado[contador]);

        // IMAGEM
        var imagem = "";
        //console.log(resultado[contador].MT.imagem);
        if (resultado[contador].MT.imagem != undefined) {
          //    alert('tem imagem');
          imagem = resultado[contador].MT.imagem;
        }

        if (imagem != "") {
          html = html.replace(
            "{IMG}",
            '<span class="wrapper-image" style="background-image:url(' +
              imagem +
              ')"></span>'
          );
        } else {
          html = html.replace("{IMG}", "");
        }

        // CATEGORIA
        var categoria = "";

        if (resultado[contador].categoria != undefined) {
          categoria = resultado[contador].categoria;
        }

        if (categoria != "") {
          html = html.replace(
            "{CATEGORIA}",
            '<span class="detalhe">' + categoria + "</span>"
          );
        } else {
          html = html.replace("{CATEGORIA}", "");
        }

        // DATA
        var data = "";
        if (resultado[contador].MT.data_publicacao_completa != undefined) {
          data = resultado[contador].MT.data_publicacao_completa;
        }

        if (data != "") {
          //D:2015 02 09 16 22 20+03'00'
          //07/06/2015 - 13:40
          // 2015-10-30 14:17:00
          //data = data.substring(8,10) + "/" + data.substring(6,8) + "/" + data.substring(2,6) + " - " + data.substring(10,12) + ":" + data.substring(12,14);
          data =
            data.substring(8, 10) +
            "/" +
            data.substring(6, 8) +
            "/" +
            data.substring(2, 6) +
            " " +
            data.substring(10, 12) +
            ":" +
            data.substring(12, 14);

          html = html.replace(
            "{DATA}",
            '<span class="data">' + data + "</span>"
          );
        } else {
          html = html.replace("{DATA}", "");
        }

        // TÍTULO
        var titulo = "";
        if (resultado[contador].MT.titulo != undefined) {
          titulo = resultado[contador].MT.titulo;
        }

        if (titulo != "") {
          html = html.replace(
            "{TITULO}",
            '<span class="news-text">' + titulo + "</span>"
          );
        } else {
          html = html.replace("{TITULO}", "");
        }

        // Views
        if (resultado[contador]["total_views"] != undefined) {
          html = html.replace(
            "{VIEWS}",
            '<span class="views"><span class="fa fa-eye"></span> ' +
              resultado[contador]["total_views"] +
              "</span>"
          );
        } else {
          html = html.replace("{VIEWS}", "");
        }

        // Views
        if (resultado[contador]["total_comments"] != undefined) {
          html = html.replace(
            "{COMENTARIOS}",
            '<span class="comments"><span class="fa fa-comment"></span> ' +
              resultado[contador]["total_comments"] +
              "</span>"
          );
        } else {
          html = html.replace("{COMENTARIOS}", "");
        }

        //

        //if (pagina == 1 && contador <= 1)
        //{
        // prepend
        //$("div.mais-lidas").insertBefore(html);
        //  $(html).insertBefore("div.panel-default.mais-lidas:parent()");
        //}
        //else
        //{
        // append
        //}
        allHtml += html;
      }

      $(".btn-more-news").removeClass("loading-news");

      // se vieram menos itens do que a página, é porque é a última página.
      // neste caso esconde o botão "Mais Resultados"
      if (itens_por_pagina > resultado.length) {
        $(".btn-more-news").hide();
      } else {
        $(".btn-more-news").show();
      }

      console.log("LOAD NEWS");
      var $conteudo = $(allHtml);
      $(".mais-lidas-fixo")
        .parent()
        .append($conteudo);

      /*
            if ( tjNews.newsGrid ) {
                tjNews.newsGrid.masonry( "destroy" );
            }

            tjNews.newsGrid = $(".list-news").masonry({
                itemSelector: ".col-news",
                stamp: '.mais-lidas-fixo'
            });
            */
      if (!tjNews.newsGrid) {
        tjNews.newsGrid = $(".mais-lidas-fixo")
          .parent()
          .masonry({
            itemSelector: ".col-news",
            stamp: ".mais-lidas-fixo"
          });
      } else {
        tjNews.newsGrid.masonry("appended", $conteudo);
        tjNews.newsGrid.masonry("layout");
      }
    },
    error: function(jqXHR, textStatus, errorThrown) {
      alert(
        "Ocorreu algum erro durante a requisição. Tente novamente em instantes."
      );
      //alert(textStatus + " -- " + errorThrown);
      $(".btn-more-news").removeClass("loading-news");
    }
  });
}
/*
function SalvarContadorVisualizacao()
{
    if ($("#id_noticia").size() > 0 && $("#id_noticia").val() != "")
    {
        var dados = {
            id: $("#id_noticia").val(),
            action: "SalvarContadorVisualizacao"
        };

        jQuery.ajax({
            data: dados,
            url: FRMAjax.ajaxurl,
            dataType: "json",
            method: "GET",
            success: function(resposta)
            {
            }
        });
    }
}

function ObterTotalVisualizacao()
{
    if ($("#total_views").size() > 0 && $("#id_noticia").size() > 0 && $("#id_noticia").val() != "")
    {
        var dados = {
            id: $("#id_noticia").val(),
            action: "ObterTotalVisualizacao"
        };

        jQuery.ajax({
            data: dados,
            url: FRMAjax.ajaxurl,
            dataType: "json",
            method: "GET",
            success: function(resposta)
            {
                $("#total_views").html('<span class="fa fa-eye"></span> ' + resposta).show();
            }
        });
    }
}
*/

$(function() {
  // Page-noticias
  if ($("#page_noticia_id").size() > 0 && $("#page_noticia_id").val() != "") {
    var dados = {
      id: $("#page_noticia_id").val(),
      action: "CarregarPageNoticias"
    };

    jQuery.ajax({
      data: dados,
      url: FRMAjax.ajaxurl,
      //dataType: "json",
      method: "GET",
      success: function(resposta) {
        var partes = resposta.trim().split("|||");

        if (partes[0].replace(/(\r\n|\n|\r)/gm, "") == "logado") {
          $("#div-config-notificacoes").show();
        }

        $("#div-minhas-noticias-resultado").html(partes[1]);

        $("#config-noticias").html(partes[2]);

        // inicializa o configurador
        newsConfig.init();
        $("#config-noticias")
          .find(".selectpicker")
          .each(function() {
            $(this).selectpicker({ container: "body" });
          });

        $(window).trigger("resize");
      }
    });
  }

  //SalvarContadorVisualizacao();
  // Detalhe das notícias
  if ($("#id_noticia").size() > 0 && $("#id_noticia").val() != "") {
    var dados = {
      id: $("#id_noticia").val(),
      action: "SalvarContadorVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {}
    });
  }
  //ObterTotalVisualizacao();
  if (
    $("#total_views").size() > 0 &&
    $("#id_noticia").size() > 0 &&
    $("#id_noticia").val() != ""
  ) {
    var dados = {
      id: $("#id_noticia").val(),
      action: "ObterTotalVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {
        $("#total_views")
          .html('<span class="fa fa-eye"></span> ' + resposta)
          .show();
      }
    });
  }

  $("body").on("click", ".save-minhas-noticias", function(e) {
    e.preventDefault();
    var data = $("#config-noticias").serializeArray();

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      if (response.indexOf("http") > -1) window.location.href = response;
    });
  });

  if ($(".page").hasClass("noticias")) {
    $("body").on("click", ".comarca-item", function(e) {
      e.preventDefault();
      $(this).remove();
      var jaSelecionadas = $('input[name="comarcas"]').val();
      jaSelecionadas = jaSelecionadas.split(",");
      indice = jaSelecionadas.indexOf($(this).data("slug"));
      jaSelecionadas.splice(indice, 1);
      slug = jaSelecionadas.toString();
      $('input[name="comarcas"]').val(slug);

      $(".comarca-container .round-repeat").text($(".comarcas-list li").length);
    });

    var timeoutSlick;

    $("body").on("click", "#news-button", function() {
      clearTimeout(timeoutSlick);
      timeoutSlick = setTimeout(function() {
        $(window).trigger("resize");
      }, 500);
    });

    //--- NEWS
    function Noticias() {
      var _scope = this,
        tabSizeActive = "";
      this.template =
        '<a href="javascript:void(0);" class="list-group-item news-item clearfix"><span class="conteudo-news"><span class="detalhe">{{CATEGORIA}}</span><span class="data">{{DATA}}</span>{{TEXTO}}</span></a>';
      this.newLength = 0;
      this.addedNews = [];

      this.init = function() {
        var scrollContainer;

        //MORE NEWS
        $(".btn-more-news").on("click", function(event) {
          event.preventDefault();
          $(this).addClass("loading-news");

          // Ao clicar no botão "Mais Notícias", carregar via ajax os outros itens.
          BuscarNoticias();
        });

        //Pesquisar
        $(".btn-search").on("click", function() {
          // limpa todos os registros da tela
          LimparResultado();

          // reiniciao contador de páginas
          $("#filtro_page").val("0");

          BuscarNoticias();
        });

        //
        $("#destaques-button").on("click", function() {
          clearTimeout(timeoutSlick);
          timeoutSlick = setTimeout(function() {
            $("#banner-noticias").slick("setPosition");
          }, 500);
        });

        $(window).on("resize", function() {
          if (
            ($(window).width() >= 768 && tabSizeActive === "xs") ||
            tabSizeActive === ""
          ) {
            tabSizeActive = "lg";
            $(".main-tab")
              .removeClass("in")
              .removeClass("active");
            $(".main-tab")
              .addClass("in")
              .addClass("active");

            scrollContainer.update("relative");
          }
          if (
            ($(window).width() < 768 && tabSizeActive === "lg") ||
            tabSizeActive === ""
          ) {
            if (tabSizeActive === "xs") {
              //CONFIGURE AGAIN WHEN BACK FROM RESPONSIVE XS
              _scope.reConfig();
            }
            tabSizeActive = "xs";
            $(".main-tab")
              .removeClass("in")
              .removeClass("active");
            $(".main-tab")
              .eq(0)
              .addClass("in")
              .addClass("active");

            scrollContainer.update("relative");
          }
        });

        $(".container-news").tinyscrollbar({ axis: "y", wheelLock: false });
        scrollContainer = $(".container-news").data("plugin_tinyscrollbar");

        $(window).trigger("resize");
        // Carrega as primeiras notícias ao carregar a página.
        LimparResultado();
      };

      this.init();
    }

    function NewsConfig() {
      var _scope = this,
        templateComarca =
          '<li class="comarca-item" data-slug="{{SLUG}}">{{NAME}} <a href="#"><span class="fa fa-times"></span></a></li>';

      this.init = function() {
        $(".comarca-container").tinyscrollbar({ wheelLock: false });
        $(".categoria-container").tinyscrollbar({ wheelLock: false });

        $(".add-comarca").css("display", "block");
        $("body").on("click", ".add-comarca .plus-button", function() {
          $(".add-comarca").css("display", "");
          $(".add-comarca-choice").css("display", "block");
        });
        $("body").on("click", ".add-comarca-choice .close-button", function() {
          $(".add-comarca").css("display", "block");
          $(".add-comarca-choice").css("display", "");
        });

        $("body").on("click", "#config-button", function() {
          clearTimeout(timeoutSlick);
          timeoutSlick = setTimeout(function() {
            $(".comarca-container").tinyscrollbar({ wheelLock: false });
            $(".categoria-container").tinyscrollbar({ wheelLock: false });
            $(window).trigger("resize");
          }, 500);
        });

        //PICKER SELECT
        $("body").on("change", ".comarca-picker .selectpicker", function() {
          var selected = $(this).find("option:selected");

          clearTimeout(timeoutSlick);
          timeoutSlick = setTimeout(
            function() {
              $(".comarca-picker")
                .find(".selectpicker")
                .selectpicker("deselectAll");
              $(".comarca-picker")
                .find(".selectpicker")
                .selectpicker("refresh");

              _scope.addComarca(selected.text(), selected.val());
              _scope.addSelected(selected.val(), "comarcas");
            }.bind(this),
            100
          );
        });

        // PICKER CATEGORIAS
        $("body").on(
          "change",
          'div.checkbox input[type="checkbox"]',
          function() {
            _scope.addSelected($(this).val(), "categorias");
            _scope.addCategoria();
          }
        );

        //PICKER NOTIFICACAO
        $("body").on("change", "#toggle-notifications", function() {
          $('input[name="recebe-notificacao"]').val($(this).is(":checked"));
        });

        //TOGGLE
        $("#toggle-notifications").bootstrapToggle({
          size: "mini",
          style: "toggle-rounded",
          onstyle: "success",
          offstyle: "danger",
          width: 80,
          height: 30,
          on: "SIM",
          off: "NÃO"
        });
      };

      this.addSelected = function(slug, input) {
        var jaSelecionadas = $('input[name="' + input + '"]').val();
        if (input == "categorias") {
          if ($('input[name="' + slug + '"]').is(":checked")) {
            if (jaSelecionadas == "") separador = "";
            else separador = ",";
            slug = jaSelecionadas + separador + slug;
          } else {
            jaSelecionadas = jaSelecionadas.split(",");
            indice = jaSelecionadas.indexOf(slug);
            jaSelecionadas.splice(indice, 1);
            slug = jaSelecionadas.toString();
          }
        } else {
          if (jaSelecionadas == "") separador = "";
          else separador = ",";
          slug = jaSelecionadas + separador + slug;
        }

        $('input[name="' + input + '"]').val(slug);
      };

      this.addComarca = function(name, slug) {
        var item = $(
          templateComarca.replace("{{NAME}}", name).replace("{{SLUG}}", slug)
        );

        $(".comarcas-list").append(item);
        $(window).trigger("resize");

        $(item).click(function(e) {
          e.preventDefault();
          $(this).remove();
          $(".comarca-container .round-repeat").text(
            $(".comarcas-list li").length
          );
        });

        $(".comarca-container .round-repeat").text(
          $(".comarcas-list li").length
        );
      };

      this.addCategoria = function() {
        $(".categoria-container .round-repeat").text(
          $(".categoria-container").find(
            ".checkbox input[type='checkbox']:checked"
          ).length
        );
      };

      this.init();
    }

    tjNews = new Noticias();
    newsConfig = new NewsConfig();
    //

    // Carrega as notícias no load da página
    BuscarNoticias();
  }

  if ($(document.body).hasClass("single")) {
    // INITIALIZATION
    var actualSidebarOpened = new SidebarResponsive();

    $(".slider-resp").each(function() {
      new ResponsiveRelNews($(this));
    });
  }

  //--- RESPONSIVE RELATED NEWS
  function ResponsiveRelNews(container) {
    this.init = function() {
      var swipeLimit,
        sizeContainer = container.find(".pagination-news-mob li").length * 100;

      container
        .find(".pagination-news-mob li")
        .each(function(index) {
          $(this).data("index", index);
        })
        .on("click", this.handler.bind(this));

      swipeLimit = Math.max(0, sizeContainer - 100);
      container.find(".list-group").data("swipe-limit", swipeLimit);

      container
        .find(".pagination-news-mob li")
        .eq(0)
        .trigger("click");

      container.find(".list-group").on("SWIPE_CHANGE", function(event, index) {
        container
          .find(".pagination-news-mob")
          .find(".active")
          .removeClass("active");
        container
          .find(".pagination-news-mob li")
          .eq(index)
          .addClass("active");
      });
    };

    this.handler = function(event) {
      event.preventDefault();
      var index = $(event.currentTarget).data("index");

      if ($(event.currentTarget).hasClass("active")) return;

      container
        .find(".pagination-news-mob")
        .find(".active")
        .removeClass("active");
      $(event.currentTarget).addClass("active");

      container
        .find(".list-group")
        .addClass("active-" + index)
        .animate({ left: -index * 100 + "%" });
    };

    if (container.find(".list-group-item").length > 1) this.init();
    else container.find(".pagination-news-mob").remove();
  }

  //--- RESPONSIVE SIDEBAR
  function SidebarResponsive() {
    this.init = function() {
      $(".sidebar-container")
        .children(".panel")
        .eq(0)
        .addClass("opened");

      $(".sidebar-container")
        .find(".button-responsive")
        .each(function(index) {
          $(this).data("index", index);
        })
        .on("click", this.handler.bind(this));
    };

    this.handler = function(event) {
      event.preventDefault();
      var nextItem = $(".sidebar-container")
        .children(".panel")
        .eq($(event.currentTarget).data("index"));

      if (!nextItem.hasClass("opened")) nextItem.addClass("opened");
      else nextItem.removeClass("opened");
    };

    this.init.call(this);
  }
});

$(function() {
  $("body").on("click", ".mark-all-as-read", function(e) {
    e.preventDefault();

    var data = {
      action: "MarkAllAsRead"
    };

    jQuery.post(FRMAjax.ajaxurl, data, function(response) {
      if (response.replace(/(\r\n|\r|\n)/gm, "") === "success") {
        $(".notificacoes-topo")
          .find(".nova")
          .removeClass("nova");
        $(".notificacoes-topo")
          .find(".total-notificacoes")
          .html("0");

        //$(".notificacoes-topo div.dropdown-menu .lista-dropdown-menu.list-group a.nova").removeClass('nova');
      }
    });
  });

  $("body").on(
    "click",
    ".notificacoes-topo .btn-link, .notifica .btn-link",
    function(e) {
      window.location.href = $(this).data("url");
    }
  );
});
$(function() {
  if ($(".page").hasClass("publicacoes-administrativas")) {
    $(".table").data("swipe-limit", 500);
  }
});
$(function() {
  if ($(".page").hasClass("revista-dos-juizados-especiais")) {
    $(document).ready(function() {
      $(".edicoes-list").tinyscrollbar({ wheelLock: false });
    });
  }
});
$(function() {
  //SalvarContadorVisualizacao();
  if (
    $("#id_revistajustica").size() > 0 &&
    $("#id_revistajustica").val() != ""
  ) {
    var dados = {
      id: $("#id_revistajustica").val(),
      action: "SalvarContadorVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {}
    });
  }

  //ObterTotalVisualizacao();
  if (
    $("#total_views").size() > 0 &&
    $("#id_revistajustica").size() > 0 &&
    $("#id_revistajustica").val() != ""
  ) {
    var dados = {
      id: $("#id_revistajustica").val(),
      action: "ObterTotalVisualizacao"
    };

    jQuery.ajax({
      data: dados,
      //url: FRMAjax.ajaxurl,
      url: FRMAjax.ajaxurlv2,
      dataType: "json",
      method: "GET",
      success: function(resposta) {
        $("#total_views")
          .html('<span class="fa fa-eye"></span> ' + resposta)
          .show();
      }
    });
  }

  if ($(".page").hasClass("revista-justica-e-historia")) {
    //MORE ITENS
    $(".btn-more-news").on("click", function() {
      $(this).addClass("loading-news");
      setTimeout(function() {
        $(".btn-more-news").removeClass("loading-news");
      }, 2000);
    });
  }
});
function filtroItens() {
  var filterSelect = $(".page-filtro-itens #categoria-filtro"),
    container = $(".list-itens"),
    intervalMixitUp = setInterval(function() {
      if ($("#sistemas-container").find(".ajax-loader").length === 0) {
        clearInterval(intervalMixitUp);
        $(container).mixitup({
          targetSelector: ".mix",
          filterSelector: ".filter"
        });
      }
    }, 100);

  filterSelect.on("change", function() {
    container.mixitup("filter", this.value);
  });
}

$(document).ready(function() {
  if ($("body").hasClass("sistemas")) {
    // GRAVA SISTEMA COMO FAVORITO

    $(document).on("AJAX_INIT_COMPLETE", function(event, data) {
      favEvent($(data));
      setTimeout(function() {
        $(".list-itens").mixitup();
      }, 100);
    });

    filtroItens();

    $(".sistemas .sistemas-form-search .btn-search").click(function(e) {
      e.preventDefault();

      // elementos da caixa de pesquisa
      busca = $('.sistemas .sistemas-form-search input[name="busca"]').val();

      $('#form-sistemas input[name="page"]').val(1);

      // carrega elementos form de resultado da tpl-sistemas-listagem
      // no clique do form de pesquisa
      $('#form-sistemas input[name="busca"]').val(busca);

      // serializa o form da lisagem de resultado e envia
      // para método getSistemas da sistemas-helper via ajax
      var data = $("#form-sistemas").serializeArray();

      jQuery.post(FRMAjax.ajaxurl, data, function(response) {
        var container = $(".list-itens"),
          objResponse = $("#sistemas-container").html(response); // retorno html montato da funcao getSistemas

        favEvent(objResponse);

        setTimeout(function() {
          container.mixitup();
        }, 500);
      });
    });
  }
  function favEvent(container) {
    $(container)
      .find(".btn-sis-favoritos")
      .on("click", function(e) {
        e.preventDefault();

        var params = {
          action: "adicionaRemoveFavorito",
          post_id: $(this).data("id"),
          const_fav: "USER_SYSTEM_FAVORITE"
        };

        $(".btn-favoritos").toggleClass("ativo");

        jQuery.post(FRMAjax.ajaxurl, params, function(response) {
          location.reload();
        });
      });
  }
  // link para menu do topo
  $("body").on("click", ".lista-sistemas-topo .bloco-mais .btn-link", function(
    e
  ) {
    window.location.href = $(this).data("url");
  });
});
(function(window, undefined) {
  "use strict";
  // if ( $('ul').hasClass('share-buttons')) {
  $(document).ready(function() {
    $(".bt-share").click(function(e) {
      e.preventDefault();
      window.open(
        $(this).attr("href"),
        "shareWindow",
        "height=450, width=550, top=" +
          ($(window).height() / 2 - 275) +
          ", left=" +
          ($(window).width() / 2 - 225) +
          ", toolbar=0, location=0, menubar=0, directories=0, scrollbars=0"
      );
      return false;
    });
  });
  // }
})(this);
function SwipeWhenXS(container) {
  var _scope = this;
  this.cardapioPos = 0;
  this.changeTableOffset = 50;
  this.outOfBounds = 0.1;

  this.init = function() {
    $(container).swipe({
      //Generic swipe handler for all directions
      allowPageScroll: "vertical",
      triggerOnTouchEnd: true,
      swipeStatus: function(event, phase, direction, _distance) {
        console.log($(document.body).hasClass("is-mobile"), direction);
        if (!$(document.body).hasClass("is-mobile")) return false;
        if (direction === "up" || direction === "down") return false;

        var distance = _distance * (direction === "left" ? -1 : 1);
        position = 0;

        if (phase == "move") {
          position =
            (distance * 100) /
            $(this)
              .parent()
              .width();
          position = _scope.cardapioPos + position;

          if (position > 0) position *= _scope.outOfBounds;

          if (position < -$(container).data("swipe-limit")) {
            //CALCULO - LIMITE + (DIFERENÇA * MULTIPLICADOR);
            position =
              -$(container).data("swipe-limit") +
              (position + $(container).data("swipe-limit")) *
                _scope.outOfBounds;
          }

          $(this)
            .stop(true, true)
            .data("position", position)
            .css("left", position + "%");
        }

        if (phase == "cancel" || phase == "end") {
          position = _scope.cardapioPos;
          if (direction === "left" && _distance > _scope.changeTableOffset) {
            position = _scope.cardapioPos - 100;
          } else if (
            direction === "right" &&
            _distance > _scope.changeTableOffset
          ) {
            position = _scope.cardapioPos + 100;
          }

          position = Math.max(position, -$(container).data("swipe-limit"));
          position = Math.min(position, 0);

          _scope.cardapioPos = position;
          $(this).animate({ left: _scope.cardapioPos + "%" }, 300);
          $(container).trigger(
            "SWIPE_CHANGE",
            Math.abs(_scope.cardapioPos / 100)
          );
        }
      },
      threshold: 75,
      excludedElements: ""
    });
  };

  setTimeout(this.init.bind(this), 500);
}

$(document).ready(function() {
  $(".swipe-xs").each(function() {
    var swipeWhenXS = new SwipeWhenXS(this);
  });
});
var loaderGeral = jQuery("#loader-geral");
var alertaContainerSlider = false;

/*
var contador = 0;
jQuery.ajaxSetup({
	beforeSend: function() {
		loaderGeral.fadeIn();
		contador++;
	},
	complete: function(){
		contador--;
		if (contador == 0)
		{
			setTimeout(function(){loaderGeral.fadeOut();},800);
		}
	},
	success: function() {
		contador--;
		if (contador == 0)
		{
			setTimeout(function(){loaderGeral.fadeOut();},800);
		}
	}
});
*/
$(document)
  .ajaxStart(function() {
    loaderGeral.fadeIn();
  })
  .ajaxStop(function() {
    setTimeout(function() {
      loaderGeral.fadeOut();
      /*após todos os ajax atualiza os scrollers para estes funcionarem */
      jQuery(".scroller").each(function() {
        //console.log('ajustando os scrollers');
        scroller = jQuery(this).tinyscrollbar();
        var scroller = jQuery(scroller).data("plugin_tinyscrollbar");
        scroller.update();
      });
      jQuery(".update_after_ajax").each(function() {
        //console.log('ajustando os scrollers listagem');
        update_after_ajax = jQuery(this).tinyscrollbar();
        var update_after_ajax = jQuery(update_after_ajax).data(
          "plugin_tinyscrollbar"
        );
        update_after_ajax.update();
      });
    }, 800);
  });

var $window = jQuery(window);
var windowHeight = $window.height();
var windowWidth = $window.width();

/* blocos alturas iguais */
equalheight = function(container) {
  var currentTallest = 0,
    currentRowStart = 0,
    rowDivs = new Array(),
    $el,
    topPosition = 0;

  jQuery(container).each(function() {
    $el = jQuery(this);
    jQuery($el).height("auto");
    topPostion = $el.position().top;

    if (currentRowStart != topPostion) {
      for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
        rowDivs[currentDiv].height(currentTallest);
      }
      rowDivs.length = 0; // empty the array
      currentRowStart = topPostion;
      currentTallest = $el.height();
      rowDivs.push($el);
    } else {
      rowDivs.push($el);
      currentTallest =
        currentTallest < $el.height() ? $el.height() : currentTallest;
    }
    for (currentDiv = 0; currentDiv < rowDivs.length; currentDiv++) {
      rowDivs[currentDiv].height(currentTallest);
    }
  });
};

if ($(".breadcrumb").length > 0) {
  var pageTitle = $(".breadcrumb")
    .find(".active")
    .text();
  var breadcrumbMobile = $(
    '<div class="navegacao-mobile"><div class="form"><div class="btn-group bootstrap-select dropdown"><button type="button" class="btn dropdown-toggle btn-default" data-toggle="dropdown" data-id="select-breadcrumb"><span class="filter-option pull-left">' +
      pageTitle +
      '</span>&nbsp;<span class="bs-caret"><span class="caret"></span></span></button><ul class="dropdown-menu" aria-labelledby="select-breadcrumb"></ul></div></div></div>'
  );
  $(".breadcrumb")
    .find("li")
    .clone()
    .appendTo(breadcrumbMobile.find("ul"));

  $("#conteudo-page").prepend($(breadcrumbMobile));
}

function QS(valor) {
  var queryString = decodeURIComponent(location.href);
  var search = queryString.split("?");
  if (search.length > 1) {
    var params = search[1].split("&");

    for (var i = 0; i < params.length; i++) {
      var pair = params[i].split("=");
      if (pair[0] == valor && pair[1]) {
        return pair[1];
      }
    }
  }

  return undefined;
}

function SalvarVisualizacaoNotificacao() {
  if ($(".pagina-com-notificacao").length > 0) {
    var id = QS("notification_id");

    if (id) {
      //alert(id);
      var dados = {
        notification_id: id,
        action: "MarcarNotificacaoLida"
      };

      jQuery.ajax({
        data: dados,
        //url: FRMAjax.ajaxurl,
        url: FRMAjax.ajaxurlv2,
        dataType: "json",
        method: "GET",
        success: function(resposta) {}
      });
    }
  }
}

/* funcoes gerais */
var timeoutOverlay;

function gerais() {
  $("body").on("click", ".dropdown-toggle", function() {
    if (!$(this).hasClass("item-normal")) {
      if ($(this).hasClass("list-group-item-sub")) {
        $(this)
          .find("i")
          .toggleClass("fa-caret-down fa-caret-up");
      } else {
        $(this)
          .find("i")
          .toggleClass("fa-chevron-down fa-chevron-up");
      }
    }
  });

  $('.bloco-busca a[data-toggle="tab"]').on("shown.bs.tab", function(e) {
    var target = $(e.target).attr("href"),
      targetClean;

    if (target.substr(target.length - 4) === "-red") {
      $("#topo")
        .find(".bloco-busca")
        .find(".nav-tabs")
        .find("a")
        .each(function() {
          if ($(this).text() === $(e.currentTarget).text()) {
            $(this).trigger("click");
          }
        });
    } else {
      $("#topo-fixo")
        .find(".bloco-busca")
        .find(".nav-tabs")
        .find("a")
        .each(function() {
          if ($(this).text() === $(e.currentTarget).text()) {
            $(this).trigger("click");
          }
        });
    }
  });

  $("body").on("click", ".btn-overlay-header", function(event) {
    event.preventDefault();
    var overlay = $("body").children(".overlay-internas");

    if (
      $(event.currentTarget)
        .parent()
        .hasClass("open")
    ) {
      $(event.currentTarget)
        .parent()
        .removeClass("open");
      overlay.stop(true).fadeOut(500);

      clearTimeout(timeoutOverlay);
      timeoutOverlay = setTimeout(function() {
        $("#topo > .navbar").css("z-index", "");
      }, 500);

      overlay.off("click");
    } else {
      clearTimeout(timeoutOverlay);
      $(event.currentTarget)
        .parent()
        .parent()
        .find(".open")
        .removeClass("open");
      $(event.currentTarget)
        .parent()
        .addClass("open");

      overlay.stop(true).fadeIn(500);
      $("#topo > .navbar").css("z-index", "99999");

      overlay.off("click").on("click", function() {
        $(event.currentTarget).trigger("click");
      });
      overlay.each().focusout(function() {
        //console.log('xxx');
      });
    }
  });

  $("body").on("click", ".lista.notifica > button", function() {
    if (
      $(this)
        .parent()
        .hasClass("open")
    ) {
      $(this)
        .parent()
        .css("z-index", "9999");
      $("#topo-fixo .conteudo-menu-geral").css("z-index", "auto");
    } else {
      $(this)
        .parent()
        .css("z-index", "");
      $("#topo-fixo .conteudo-menu-geral").css("z-index", "");
    }
  });

  $("body").on("click", ".accordion-toggle", function() {
    $(this)
      .find("i")
      .toggleClass("fa-chevron-down fa-chevron-up");
  });

  $("body").on("click", ".btn-group .btn", function() {
    $(this)
      .addClass("active")
      .siblings()
      .removeClass("active");
  });

  $("body").on("click", ".btn-group .btn", function() {
    $(this)
      .addClass("active")
      .siblings()
      .removeClass("active");
  });

  /* blocos alturas iguais */
  equalheight(".equal .panel");

  $("body").bind("click", function(e) {
    var menuOpened = false;
    $(".menu-geral").each(function() {
      if ($(this).hasClass("show")) menuOpened = true;
    });

    if (!menuOpened && meusAnunciosStatus === "closed") {
      if (
        jQuery(e.target).closest(
          ".menu-navbar, .bloco-topo-mobile, .dropdown-menu.login"
        ).length == 0
      ) {
        $(".overlay").removeClass("show");
      }
    }
  });

  var meusAnunciosStatus = "closed";
  $("body").on("click", ".btn-overlay", function() {
    var _scope = this;
    $(_scope).toggleClass("selecionado");
    var overlay = $("body").children(".overlay");

    if (overlay.hasClass("show")) {
      overlay.removeClass("show");
      $(".dropdown-menu.login .logar .dropdown-menu").hide();
      if ($("body").hasClass("meus-anuncios")) meusAnunciosStatus = "closed";
    } else {
      overlay.addClass("show");
      if ($("body").hasClass("meus-anuncios")) meusAnunciosStatus = "opened";
    }
  });

  $("body").on("click", ".keep-dropdown", function(e) {
    e.stopPropagation();
  });

  /* alerta */
  if (windowWidth < 1024) {
    var blocoAlerta = $(".alerta.conteudo");
  } else {
    var blocoAlerta = $(".alerta.top");
  }

  var conteudo = $(".englobla-conteudo"),
    height = blocoAlerta.height();

  if (!getCookie("tjrs_aviso_visto")) {
    blocoAlerta.css("display", "block", "important");
  }

  // $('.alerta .btn-fechar').on('click', function(){

  // 	if( blocoAlerta.is(":visible") ){
  // 		conteudo.css('margin-top', (height * (-1)));
  // 	} else {
  // 		conteudo.css('margin-top', height);
  // 	}
  // });

  /* menu mobile */
  $("body").on("click", ".btn-abre-menu", abreMenuHandler);

  function abreMenuHandler(event) {
    var target = jQuery(this).attr("data-rel");

    if (target !== "menu-sistema") {
      if (jQuery(event.currentTarget).hasClass("table-cell")) {
        if (
          jQuery("#" + target)
            .find("ul")
            .children("li").length <= 0
        )
          return;
      }
    }
    event.preventDefault();

    jQuery(".menu-geral").removeClass("show");
    jQuery("#" + target).addClass("show");

    if (windowWidth > 992) {
      if (!$(".btn-menu-principal").hasClass("selecionado")) {
        $(".menu-geral").removeClass("show");
      }
    }
  }

  $("body").on("click", ".btn-fechar-menu, .btn-close-menu", function() {
    var menuGeral = $(this).parents(".menu-geral");

    menuGeral.removeClass("show");

    if ($(".btn-menu-principal").hasClass("selecionado")) {
      $(".btn-menu-principal").removeClass("selecionado");
    }

    if ($(".btn-abre-menu").hasClass("selecionado")) {
      $(".btn-abre-menu").removeClass("selecionado");
    }
  });

  $("body").on("click", ".btn-voltar-menu", function() {
    var target = jQuery(this).attr("data-rel");

    jQuery(".menu-geral").removeClass("show");
    jQuery("#" + target).addClass("show");
  });

  if (getCookie("tjrs_contraste") == "true") {
    jQuery("body").addClass("contraste");
  } else {
    jQuery("body").removeClass("contraste");
  }

  $(".btn-contraste").on("click", function() {
    jQuery("body").toggleClass("contraste");
    setCookie("tjrs_contraste", jQuery("body").hasClass("contraste"), 365);
  });

  $(".scroller").tinyscrollbar();

  $(".selectpicker").each(function() {
    if (!$(this).hasClass("logar") && $(this).eq(0).name == "domain") {
      $(this).selectpicker({
        container: "body"
      });
    }
  });

  $(".selectlogin").each(function() {
    $(this).selectpicker();
  });

  if ($(".selectpicker-invite").length > 0) {
    $(".selectpicker-invite").selectpicker();
  }

  $("body")
    .children(".overlay")
    .on("click", function() {
      /*var displayLoginModal = $( ".lista-drop-login" ).children( ".dropdown-menu" ).css( "display" );

		if ( displayLoginModal === "block" )
			$( ".lista-drop-login" ).children( ".dropdown-menu" ).css( "display", "" );*/

      if ($("body").hasClass("meus-anuncios")) {
        $(this).removeClass("show");
        $(".btn-manter").trigger("click");
      }
    });

  setTimeout(function() {
    $(".lista-drop-login")
      .children("button")
      .on("click", function() {
        if (
          $(this)
            .parent()
            .hasClass("open")
        ) {
          var _rootButton = $(this).parent();
          setTimeout(function() {
            _rootButton.find(".dropdown-toggle").focus();
          }, 100);
        }
      });
  }, 100);

  /*$('body').on('click', function(event) {
		var target = $(event.target);
		if (target.parents('.bootstrap-select.logar').length) {
			event.stopPropagation();
			//$('.bootstrap-select').toggleClass('open');

			/*if(!$('.overlay').hasClass('show')) {
				$('.overlay').addClass('show');
			}//
			//$('.bootstrap-select.logar.open').removeClass('open');
		}
	});

	$('body').on('click', function(event) {
		var target = $(event.target);
		if (target.parents('.bootstrap-select.logar').length) {
			event.stopPropagation();

			if(!$('.overlay').hasClass('show')) {
				$('.overlay').addClass('show');
			}
			$('.bootstrap-select.logar.open').removeClass('open');
		}
	});

	$('body').on('click', function(event) {
		if(!$('.overlay').hasClass('show')) {

			if($('.bootstrap-select.logar').hasClass('open')) {
				$('.bootstrap-select.logar').removeClass('open');
			}

			if($('.bootstrap-select.logar .dropdown-menu').hasClass('open')) {
				$('.bootstrap-select.logar .dropdown-menu').removeClass('open, aberto');
			}
		}
	});

	$('.bootstrap-select.logar').on('click', function(){
		if(!$('.bootstrap-select logar .dropdown-menu').hasClass('open')) {
			$('.bootstrap-select.logar .dropdown-menu').addClass('aberto');
		}
	});*/

  $(".dropdown-menu li a").on("click", function() {
    $(this)
      .parents(".dropdown-menu")
      .removeClass("aberto");
  });

  $("body").on("click", ".bloco-erro .btn-fechar", function() {
    var blocoErro = $(this).parents(".bloco-erro");

    if (blocoErro.is(":visible")) {
      blocoErro.hide();
    }
  });
}

/* tables */
function tables() {
  $(".table-geral").DataTable({
    searching: false,
    ordering: false,
    paging: false,
    ordering: false,
    info: false
  });

  $(".table-ordenacao").DataTable({
    searching: false,
    ordering: true,
    paging: false,
    info: false
  });

  if ($(".table-ordenacao-documents").length > 0) {
    var columnTable,
      tableDocuments = $(".table-ordenacao-documents").DataTable({
        ordering: false,
        paging: false,
        info: false,
        initComplete: function() {
          columnTable = this.api().column(1);

          columnTable
            .data()
            .unique()
            .sort()
            .each(function(d, j) {
              var itemLista = document.createElement("li"),
                button = document.createElement("a");

              itemLista.className = "filter-item";
              button.href = "#";
              button.className = "filter-button";

              $(button)
                .append(d)
                .data("content", d);
              $(itemLista).append(button);
              $(".tabela-documents-component .dropdown-menu").append(itemLista);
            });
        }
      });

    $(".filter-button")
      .eq(0)
      .data("content", "");
    $(".filter-button").on("click", function(event) {
      event.preventDefault();
      var val = $.fn.dataTable.util.escapeRegex($(this).data("content"));

      $(".filter-button").removeClass("active");
      $(this).addClass("active");

      columnTable.search(val ? "^" + val + "$" : "", true, false).draw();
    });
    $(".button-table-documents").on("click", searchDocumentsTable);
    $(".search-table-documents").on("keyup", searchDocumentsTable);
  }
  function searchDocumentsTable(event) {
    event.preventDefault();
    tableDocuments.search($(".search-table-documents").val()).draw();
  }

  $(".table-busca").DataTable({
    searching: true,
    ordering: true,
    paging: false,
    info: false,
    sDom: '<f<"filtros-table"<"clear">>tr<ip<"clear">>',
    language: {
      search: "_INPUT_",
      searchPlaceholder: "Palavra-chave"
    }
  });

  $("div.dataTables_filter input").unbind();

  var tableBusca = $(".table-busca").dataTable();

  $(".filtro-table").on("click", function(e) {
    tableBusca.fnFilter($("div.dataTables_filter input").val());
  });

  // $(".filtros-table").html('<div class="btn-group btn-group-justified" role="group" data-toggle="buttons-radio"><button type="button" class="btn btn-default active">Todos</button><button type="button" class="btn btn-default">Categoria 1</button><button type="button" class="btn btn-default">Categoria 2</button><button type="button" class="btn btn-default">Categoria 3</button></div>');
}

function menuAncors() {
  $(".nav-anchor a").on("click", function() {
    $("html, body").animate(
      {
        scrollTop: $($(this).attr("href")).offset().top
      },
      500
    );
    return false;
  });
}

function menuAncorsMeio() {
  $(".nav-anchor-meio a").on("click", function() {
    $("html, body").animate(
      {
        scrollTop: $($(this).attr("href")).offset().top - 105
      },
      500
    );
    return false;
  });
}

function menuPrincipal() {
  var navPrincipal = $(".nav-principal");

  $(".nav-principal .nav-link").on("click", function() {
    var blocoMenu = $(this).next(),
      li = $(this).parents("li.dropdown");

    if (blocoMenu.is(":visible")) {
      $("body").removeClass("overlay-show");
      blocoMenu.hide();
      $(".nav-principal").removeClass("drop-aberto");

      $(".nav-principal li.dropdown").removeClass("opacity");
      li.removeClass("ativo");
    } else {
      $("body").addClass("overlay-show");
      $(".bloco-sub-menu-principal").hide();
      blocoMenu.show();
      $(".nav-principal").addClass("drop-aberto");

      $(".nav-principal li.dropdown").addClass("opacity");
      $(".nav-principal li.dropdown").removeClass("ativo");
      li.addClass("ativo");
    }
  });

  $("body").bind("click", function(e) {
    if (jQuery(e.target).closest(".nav-principal").length == 0) {
      $("body").removeClass("overlay-show");
      $(".bloco-sub-menu-principal").hide();
      $(".nav-principal li.dropdown").removeClass("ativo opacity");
    }
  });

  // navPrincipal.on('mouseenter', function(){
  // 	$('body').addClass('overlay-show');
  // });

  // navPrincipal.on('mouseleave', function(){
  // 	$('body').removeClass('overlay-show');
  // });

  // navPrincipal.find('li.dropdown').on('mouseenter', function(){
  // 	$('.nav-principal li.dropdown').addClass('opacity');
  // 	$(this).addClass('ativo');
  // });

  // navPrincipal.find('li.dropdown').on('mouseleave', function(){
  // 	$('.nav-principal li.dropdown').removeClass('opacity');
  // 	$(this).removeClass('ativo');
  // });
}

if (getCookie("avisos").indexOf($(".alerta").data("id")) > -1) {
  $(".alerta").hide();
}

function setIntexWarning() {
  $(".alerta .container")
    .find(".slick-slide")
    .each(function(index) {
      $(this).data("index", index);
    });
}

// PARA ABRIR O ALERTA
// Esta função foi colocada dentro do resultado do ajax que busca os templates
// no arquivo home.js
// Araujo
/*
if ($('.btn-alerta:first').hasClass("sim")) {
	if (getCookie('avisos').indexOf($('.btn-alerta:first').data('id')) == -1) {
		$(".btn-alerta:first").trigger("click");
	}
}
*/

function CliqueFechar(modal, id) {
  var params = {
    action: "clickEstouCiente",
    alert_id: id,
    const_fav: "USER_ALERT_AWARE"
  };

  jQuery.post(FRMAjax.ajaxurl, params, function(response) {
    /*
			if (response !== "") {
				console.log(response);
			}
			if ( $('.modal-alerta').size() > 0 )
				$(".btn-alerta:first").trigger("click");
			*/
  });
}

// ALERTA DO TOPO
$("body").on("click", ".alerta .content .btn-fechar", function(e) {
  e.preventDefault();
  modal_atual = $(this).parent();

  CliqueFechar(modal_atual, $(this).data("id"));

  //alert(modal_atual.data("index"));
  //alert(alertaContainerSlider);

  alertaContainerSlider.removeItem(modal_atual.data("index"));

  setIntexWarning();

  //
  var tempText,
    text,
    lengthItens = $(".alerta .container").find(".slick-slide").length;

  if (lengthItens > 1) {
    $(".alerta .container")
      .find(".slick-slide")
      .each(function(index, value) {
        tempText = $(this)
          .find(".pages")
          .text()
          .split(" ");
        text = index + 1 + " " + tempText[1] + " " + lengthItens;
        $(this)
          .find(".pages")
          .text(text);
      });
  } else {
    if (lengthItens === 1) {
      $(".alerta .alerta-botoes").remove();
      $(".alerta .container")
        .find(".pages")
        .empty();
    }
  }
});

$("body").on("click", ".btn-estou-ciente", function(e) {
  e.preventDefault();
  modal_atual = $(this)
    .parent()
    .parent()
    .parent()
    .parent();
  CliqueFechar(modal_atual, $(this).data("id"));

  $(e.currentTarget).off("click");
  nextWarningModal(modal_atual);
});
var warningModal = {
  length: $(".modal-alerta").size(),
  actual: 0
};
$("body").on(
  "click",
  ".modal-alerta .modal-dialog .modal-content .close",
  function(e) {
    //e.preventDefault();
    // aqui está errado. Corrigir
    modal_atual = $(this)
      .parent()
      .parent()
      .parent();

    $(e.currentTarget).off("click");
    nextWarningModal(modal_atual);
  }
);

function nextWarningModal(modal) {
  //setTimeout(function() {
  modal.remove();
  $(".modal-backdrop").remove();
  $("body")
    .removeClass("modal-open")
    .css("padding-right", "");
  //}, 1000);

  //setTimeout(function() {
  //	alert('aguardou 1 seg');
  //}, 1000);

  warningModal.actual++;
  //alert(warningModal.actual);
  //alert(warningModal.length);

  if ($(".modal-alerta").size() > 0) {
    //alert('a ' + $('.modal-alerta').size());
    //alert('b ' + $('.modal-alerta').eq(0).size());
    //alert('c ' + $('.modal-alerta').eq(0).find('.btn-alerta').size());

    $(".modal-alerta")
      .eq(0)
      .find(".btn-alerta")
      .trigger("click");
  } else {
    //alert('entrou no menu fixo');
    menuFixo();
  }
}

if ($("body").hasClass("home-page")) {
  $("body").on("click", "#modal-personalizar .btn-cancel", function() {
    overlay_widgets();
    location.reload();
  });

  $("body").on("submit", ".dados-widgets", function(e) {
    e.preventDefault();
    overlay_widgets();

    var params = $(this).serializeArray();

    jQuery.post(FRMAjax.ajaxurl, params, function(response) {
      if (response.indexOf("http") > -1) {
        window.location.href = response;
      }
    });
  });

  function overlay_widgets() {
    $("#modal-personalizar .col-md-6").css("opacity", "0.4");
    $("#modal-personalizar .widgets-loading").show();
  }

  $("body").on("click", ".dados-widgets .btn-padrao", function(e) {
    e.preventDefault();
    overlay_widgets();
    $('input[name="lista_widgets"]').val("");
    $(".dados-widgets").submit();
  });

  $("body").on("click", ".widgets .item-normal", function(e) {
    if ($(this).hasClass("widget-enable")) {
      // ADICOINA A UL
      var itemWidget = $(
        "li[data-widget='" + $(this).data("widget-item") + "']"
      );
      var novaWidget = itemWidget.clone();
      novaWidget.addClass("ui-sortable-handle").removeClass("box-widget");
      //itemWidget.remove();
      var novaWidgetElem = $("ul.widgets-selecionadas").prepend(
        novaWidget[0].outerHTML
      );
      $(this)
        .removeClass("widget-enable")
        .addClass("widget-disable");
      $(this)
        .find("i.adicionar")
        .removeClass("fa-plus")
        .addClass("fa-minus");

      $(novaWidgetElem)
        .find(".excluir-widget")
        .click(function() {
          var item = $(this)
            .parent()
            .parent()
            .parent()
            .parent();
          removeWidget(item);
          item.remove();
        });
      // ADICIONA A LISTA
      var novaLista = "";
      $("ul.widgets-selecionadas li").each(function() {
        novaLista += $(this).data("widget") + ",";
      });
      $('input[name="lista_widgets"]').val(novaLista);
    } else {
      e.preventDefault();
    }
  });

  $("body").on("click", ".excluir-widget", function() {
    var item = $(this)
      .parent()
      .parent()
      .parent()
      .parent();
    removeWidget(item);
    item.remove();
  });

  function removeWidget(widget) {
    var widget = widget.data("widget");
    var lista_widgets = $('input[name="lista_widgets"]').val();
    lista_widgets = lista_widgets.replace(widget, "");
    $('input[name="lista_widgets"]').val(lista_widgets);
    elementButton = $(
      ".widgets .list-group a[data-widget-item='" + widget + "']"
    );
    elementButton.removeClass("widget-disable").addClass("widget-enable");
    elementButton
      .find("i.adicionar")
      .removeClass("fa-minus")
      .addClass("fa-plus");
  }

  function personalizarCapa() {
    $("#sortable .sortable-list").sortable({
      over: function() {
        removeIntent = false;
      },
      out: function() {
        removeIntent = true;
      },
      beforeStop: function(event, ui) {
        if (removeIntent == true) {
          removeWidget(ui.item);
          ui.item.remove();
        }
      },
      change: function(event, ui) {
        var novaLista = "";
        $("ul.widgets-selecionadas li").each(function() {
          novaLista += $(this).data("widget") + ",";
        });
        $('input[name="lista_widgets"]').val(novaLista);
      },
      update: function(event, ui) {
        var novaLista = "";
        $("ul.widgets-selecionadas li").each(function() {
          novaLista += $(this).data("widget") + ",";
        });
        $('input[name="lista_widgets"]').val(novaLista);
      }
    });
  }
}

function funcionalidades() {
  var totalItems = $("#carousel-funcionalidades .item").length,
    currentIndex = $("#carousel-funcionalidades .active").index() + 1,
    num = $("#modal-funcionalidades").find(".num");

  num.html("" + currentIndex + "/" + totalItems + "");

  $("#carousel-funcionalidades").on("slid.bs.carousel", function() {
    currentIndex = $("#carousel-funcionalidades .active").index() + 1;
    num.html("" + currentIndex + "/" + totalItems + "");

    var curSlide = $("#carousel-funcionalidades .active");
    if (curSlide.is(":first-child")) {
      $(".carousel-control.left").hide();
      return;
    } else {
      $(".carousel-control.left").show();
    }
    if (curSlide.is(":last-child")) {
      $(".carousel-control.right").hide();
      $(".modal-footer .btn-concluir").show();
      return;
    } else {
      $(".modal-footer .btn-concluir").hide();
      $(".carousel-control.right").show();
    }
  });

  return $(".modal").on("show.bs.modal", function() {
    var curModal;
    curModal = this;
    $(".modal").each(function() {
      if (this !== curModal) {
        $(this).modal("hide");
      }
    });
  });
}

function favoritosTj() {
  $(".btn-ordenar-favoritos").on("click", function() {
    $(".coluna .favoritos")
      .find(".lista-menu")
      .addClass("lista-favoritos");

    $(".col-favoritos .btn-ordenar-favoritos").hide();
    $(".col-favoritos .btn-salvar-favoritos").fadeIn(200);

    $(".lista-favoritos").sortable();
  });
}

function fixSubmenu(reloadSubmenu) {
  var heightItens = 0,
    maxColumns = 2,
    limitHeight = 370,
    count = 0,
    heightRel = 0;

  $(".sub-sub-menu, .bloco-sub-menu-principal")
    .css("display", "block")
    .css("visibility", "hidden");
  $(".sub-sub-menu").each(function(idx) {
    heightItens = 0;
    count = 0;
    heightRel = 0;

    if (reloadSubmenu) {
      var htmlSubmenu = $('<ul class="lista-sub-menu"></ul>');
      $(this)
        .find(".lista-sub-menu")
        .each(function() {
          htmlSubmenu.append($(this).html());
        });

      $(this)
        .find(".coluna:first")
        .siblings(".coluna")
        .remove();
      $(this)
        .find(".coluna")
        .html(htmlSubmenu);
    }

    $(this)
      .find(".lista-sub:not(.menu-item-escondido)")
      .each(function(event) {
        parentSubmenu = $(this)
          .parent()
          .parent()
          .parent()
          .parent();
        heightItens += $(this).outerHeight();
        heightRel += $(this).outerHeight();

        //CRIAR COLUNA
        if (heightRel > limitHeight) {
          count++;

          if (count <= maxColumns) {
            heightRel = $(this).outerHeight();

            var newColuna = document.createElement("div");
            newColuna.className = "coluna col-menu-" + count;
            var newList = document.createElement("ul");
            newList.className = "lista-sub-menu";

            $(newColuna).append(newList);
            parentSubmenu.children(".row-fluid").append(newColuna);
          }
        }

        //MUDAR DE COLUNA O ITEM
        for (var a = 1; a <= maxColumns; a++) {
          if (
            heightItens > limitHeight * a &&
            heightItens <= limitHeight * (a + 1)
          )
            $(this).appendTo(
              parentSubmenu.find(".col-menu-" + a).find(".lista-sub-menu")
            );
        }
        if (heightItens > limitHeight * (maxColumns + 1)) $(this).remove();
      });
  });

  $(".sub-sub-menu,.bloco-sub-menu-principal")
    .css("display", "")
    .css("visibility", "");
}

jQuery(window).resize(function() {
  equalheight(".equal .bloco");
});

function shareMail(container) {
  if ($(container).size() > 0) {
    $(container)
      .parent()
      .find(".sucesso")
      .fadeIn();
    $(container)
      .parent()
      .parent()
      .find(".social-mail")
      .on("click", function(event) {
        var item = $(event.currentTarget);
        // console.log(item.find("i").hasClass("fa-envelope-o"));
        if (item.find("i").hasClass("fa-envelope-o")) {
          item
            .find("i")
            .removeAttr("class")
            .addClass("fa fa-close");
        } else {
          item
            .find("i")
            .removeAttr("class")
            .addClass("fa fa-envelope-o");
        }
        $(this)
          .parent()
          .toggleClass("open");
      });

    $(container)
      .parent()
      .find(".sucesso .lk-enviar-outro")
      .click(function() {
        $(this)
          .parents(".sucesso")
          .fadeOut("fast", function() {
            $(this)
              .prev()
              .fadeIn();
          });
      });

    $(container).validate({
      submitHandler: function(form) {
        // some other code
        // maybe disabling submit button
        // thenkey: "value",
        jQuery.post(FRMAjax.ajaxurl, $(form).serialize(), function(response) {
          $(container).fadeOut("fast", function() {
            $(this)
              .next()
              .fadeIn();
          });
        });
        return false;
      },
      errorClass: "invalido",
      validClass: "valido",
      highlight: function(element, errorClass, validClass) {
        jQuery(element)
          .parent()
          .addClass(errorClass)
          .removeClass(validClass);
      },
      unhighlight: function(element, errorClass, validClass) {
        jQuery(element)
          .parent()
          .removeClass(errorClass)
          .addClass(validClass);
      },
      ignore: "",
      rules: {
        share_nome: {
          required: true
        },
        share_email: {
          required: true
        },
        share_amigo_nome: {
          required: true
        },
        share_amigo_email: {
          required: true
        }
      },
      messages: {
        share_nome: {
          required: "Preencha seu nome"
        },
        share_email: {
          required: "Preencha seu e-mail"
        },
        share_amigo_nome: {
          required: "Preencha o nome do seu amigo"
        },
        share_amigo_email: {
          required: "Preencha o e-mail do seu amigo"
        }
      }
    });
  }
}

/* ============
   MENU FIXO
   ============ */
function menuFixo() {
  if ($("#topo-fixo").length <= 0) return;

  $(window).on("scroll", function() {
    var topoFixo = $("#topo-fixo"),
      posicao = $("#nav-principal").offset().top,
      scr = $(window).scrollTop();

    if (scr >= posicao) {
      topoFixo.addClass("show");
    } else {
      topoFixo.removeClass("show");
      if (windowWidth > 1023) {
        $(".bloco-topo-mobile")
          .find(".btn-abre-menu")
          .removeClass("selecionado");
        $(".menu-geral").removeClass("show");
        $(".overlay").removeClass("show");
      }
    }
  });
  $(window).trigger("scroll");
}

function slideRelacionados() {
  var $slider = new DefaultSlider({
    container: ".slide-relacionados",
    options: {
      accessibility: true,
      infinite: true,
      slidesToShow: 1,
      autoplay: true,
      autoplaySpeed: 6000,
      dots: true,
      fade: true,
      pauseOnHover: false,
      arrows: false
    }
  });
}

$(".sidebar-hierarquico a").click(function(e) {
  var submenu = $(this).next(".sub-menu, .list-group-submenu");
  if (submenu.length > 0) {
    e.preventDefault();
    if (submenu.hasClass("collapse")) {
      if (submenu.hasClass("sub-menu")) {
        $(this)
          .find(".seta")
          .removeClass("fa-chevron-up");
        $(this)
          .find(".seta")
          .addClass("fa-chevron-down");
      } else {
        $(this)
          .find(".seta")
          .removeClass("fa-caret-up");
        $(this)
          .find(".seta")
          .addClass("fa-caret-down");
      }
      submenu.removeClass("collapse");
    } else {
      if (submenu.hasClass("sub-menu")) {
        $(this)
          .find(".seta")
          .removeClass("fa-chevron-down");
        $(this)
          .find(".seta")
          .addClass("fa-chevron-up");
      } else {
        $(this)
          .find(".seta")
          .removeClass("fa-caret-down");
        $(this)
          .find(".seta")
          .addClass("fa-caret-up");
      }
      submenu.addClass("collapse");
    }
  }
});

function abreMenuHierarquico() {
  if ($(".sidebar-hierarquico").length == 1) {
    var menu_item = $(".sidebar-hierarquico a[data-menu-id='" + post_id + "']");
    menu_item.addClass("ativo");
    var nivel_1 = menu_item.parent();
    var nivel_2 = nivel_1.parent();
    if (nivel_1.length > 0) nivel_1.removeClass("collapse");
    if (nivel_2.length > 0) nivel_2.removeClass("collapse");
    //console.log(menu_item);
  }
}

//SLICK CLASS
function DefaultSlider(obj) {
  //VARS
  var _root = this,
    sliderInit,
    playpauseHandler,
    checkControllers;

  this.container = $(obj.container);
  this.auxiliar = obj.container !== undefined ? $(obj.auxiliar) : {};
  this.options = obj.options || {};

  //-----METHODS
  //--PRIVATE
  sliderInit = function() {
    _root.sliderElement = _root.container
      .slick(_root.options)
      .parent()
      .each(playpauseHandler);

    //Event
    _root.container.on("beforeChange", function(
      event,
      slick,
      currentSlide,
      nextSlide
    ) {
      checkControllers("playpause");
    });

    checkControllers();
  };
  checkControllers = function(specific) {
    if (_root.sliderElement === undefined) return;
    var slickOptions = _root.getOptions();

    _root.container.each(function(index, value) {
      if (specific === undefined || specific === "arrows") {
        if (
          slickOptions.slideCount > slickOptions.originalSettings.slidesToShow
        ) {
          //HAVE SLIDER
          _root.container
            .parent()
            .find(".content-controls")
            .show();
          $(_root.options.nextArrow).fadeIn(300);
          $(_root.options.prevArrow).fadeIn(300);
        } else {
          //DONT HAVE SLIDER
          _root.container
            .parent()
            .find(".content-controls")
            .hide();
          $(_root.options.nextArrow).fadeOut(300);
          $(_root.options.prevArrow).fadeOut(300);
        }
      }

      if (specific === undefined || specific === "playpause") {
        $(this)
          .parent()
          .find(".fa-play, .fa-pause")
          .removeClass("active");
        if (!slickOptions.paused) {
          $(this)
            .parent()
            .find(".fa-play")
            .addClass("active");
        } else {
          $(this)
            .parent()
            .find(".fa-pause")
            .addClass("active");
        }
      }
    });
  };
  //handlers
  playpauseHandler = function() {
    var _scope = this;

    if ($(_scope).find(".fa-play").length > 0) {
      $(_scope)
        .find(".fa-play")
        .on("click", function() {
          $(_scope)
            .find(".slick-slider")
            .slick("slickPlay");
          checkControllers("playpause");
          _root.container.slick("slickSetOption", "autoplay", true);
        });
    }
    if ($(_scope).find(".fa-pause").length > 0) {
      $(_scope)
        .find(".fa-pause")
        .on("click", function() {
          $(_scope)
            .find(".slick-slider")
            .slick("slickPause");
          checkControllers("playpause");
          _root.container.slick("slickSetOption", "autoplay", false);
        });
    }
  };
  //--PUBLIC
  this.update = function() {
    if (_root.sliderElement === undefined) return;
    _root.container.slick("reinit");

    checkControllers();
  };
  this.setPosition = function() {
    if (_root.sliderElement === undefined) return;
    _root.container.slick("setPosition");
  };
  this.removeItem = function(index) {
    if (_root.sliderElement === undefined) return;
    _root.container.slick("slickRemove", index);
  };
  this.addItem = function(html) {
    if (_root.sliderElement === undefined) return;
    _root.container.slick("slickAdd", html);
  };
  this.getOptions = function() {
    if (_root.sliderElement === undefined) return;
    return _root.container.slick("getSlick");
  };

  //
  sliderInit();
}

$(document).ready(function() {
  gerais();
  tables();
  menuAncors();
  menuAncorsMeio();
  menuPrincipal();
  if ($("body").hasClass("home-page")) personalizarCapa();
  funcionalidades();
  favoritosTj();
  fixSubmenu();
  shareMail("#form-share-header");
  shareMail("#form-share-footer");
  slideRelacionados();
  abreMenuHierarquico();

  SalvarVisualizacaoNotificacao();

  $("#menu-geral-principal")
    .find(".menu-geral")
    .each(function() {
      $(this).insertAfter($("#menu-geral-principal"));
    });

  /*	if (!getCookie('tjrs_tutorial_visto')) {
		$('.btn-tutorial').trigger('click');
	} else {
		if ( ($('.btn-tutorial').attr('data-tem-alerta') === undefined) || ($('.btn-tutorial').attr('data-tem-alerta') == ""))
			menuFixo();
	}



	$('.modal-tutorial .close, .modal-tutorial .btn-pular, .modal-tutorial .btn-concluir').on('click', function() {
		setCookie('tjrs_tutorial_visto', true, 365);
		if ($('.btn-tutorial').attr('data-tem-alerta') !== "")
			$('.btn-alerta:first').trigger('click');
		else
			menuFixo();
	});*/

  menuFixo();

  $("body").on("click", "#topo .link-tutorial", function() {
    $(".drop-login").trigger("click");
  });
  $("body").on("click", "#menu-login .link-tutorial", function() {
    $("#menu-login .btn-fechar-menu").trigger("click");
  });

  //DATE PICKER
  $(".input-daterange").datepicker({
    language: "pt-BR",
    keyboardNavigation: false,
    orientation: "top left",
    clearBtn: true,
    format: "dd/mm/yyyy",
    forceParse: false
  });

  $("#datepicker input[name=data_inicial]")
    .datepicker({})
    .on("changeDate", function(selected) {
      startDate = new Date(selected.date.valueOf());
      startDate.setDate(startDate.getDate(new Date(selected.date.valueOf())));
      $("#datepicker input[name=data_final]").datepicker(
        "setStartDate",
        startDate
      );
    });

  $("#datepicker input[name=data_final]")
    .datepicker({})
    .on("changeDate", function(selected) {
      FromEndDate = new Date(selected.date.valueOf());
      FromEndDate.setDate(
        FromEndDate.getDate(new Date(selected.date.valueOf()))
      );
      $("#datepicker input[name=data_inicial]").datepicker(
        "setEndDate",
        FromEndDate
      );
    });

  //MASCARAS CAMPOS INPUTS FORMULÁRIOS
  $(".mask-telefone").mask("(99) 9999-9999?9");
  $(".mask-dinheiro").maskMoney({
    symbol: "R$ ",
    showSymbol: true,
    thousands: ".",
    decimal: ",",
    symbolStay: true
  });
  $(".mask-data").mask("99/99/9999");

  //	loaderGeral.fadeOut();

  jQuery(window).on("resize", function() {
    windowHeight = $window.height();
    windowWidth = $window.width();

    if (windowWidth < 992) {
      jQuery("#topo-fixo").removeClass("fixed");
    }

    if (windowWidth > 1023) {
      if (jQuery(window).scrollTop() <= 0) {
        jQuery("#topo-fixo").removeClass("show");
      } else {
        jQuery("#topo-fixo").addClass("show");
      }
    }
  });
});
$(function() {
  // GRAVA PAGINA COMO FAVORITO GERAL
  $(".btn-favoritos").click(function(e) {
    e.preventDefault();

    var params = {
      action: "adicionaRemoveFavorito",
      post_id: $(this).data("id"),
      const_fav: "USER_FAVORITE_LIST"
    };
    $(".btn-favoritos").toggleClass("ativo");
    jQuery.post(FRMAjax.ajaxurl, params, function(response) {
      location.reload();
      // if (response === "1") {
      // 	$('.btn-favoritos').addClass('ativo');
      // }
      // else {
      // 	$('.btn-favoritos').removeClass('ativo');
      // }
    });
  });
});
$(".widget-consulta-processual .tipo-consulta").change(function() {
  var tipo_consulta = $(this).val();
  ShowHideConsultaProcessual(tipo_consulta);
});

function ShowHideConsultaProcessual(item_to_show) {
  $(".widget-consulta-processual .form-consulta-processual").hide();
  $(".widget-consulta-processual ." + item_to_show).removeClass("hide");
  $(".widget-consulta-processual ." + item_to_show).show();
}
