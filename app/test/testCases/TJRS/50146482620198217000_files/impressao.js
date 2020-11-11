// JavaScript Document
function AbreImpressao(){
   var altura = screen.height-80;
   largura=750;
   var janela = window.open('/versao_impressao/impressao.php','impr1','top=2,status=no,height='+altura+',width='+largura+',scrollbars=yes');
}

function BuscaConteudo(){
   var elemento = document.getElementById("conteudo");
   if (elemento)
         return TrataConteudo(elemento.innerHTML);
	  else
	     return '';   
}

function BuscaTitulo(){
      var elemento = document.getElementById("titulo");
	  if (elemento)
         return TrataConteudo(elemento.innerHTML);
	  else
	     return '';
}

function TrataConteudo(texto){
   ListaPattern = new Array;
   ListaSubst = new Array;   
   ListaPattern[ListaPattern.length] = / bgColor\=("\#[0-9ABCDEFabcdef]{6}"|\#[0-9ABCDEFabcdef]{6})/gi;  // Remove as cores das células
   ListaSubst[ListaSubst.length]= '';
   ListaPattern[ListaPattern.length] = /texto_geral/gi  //Ajusta para estilos de impressão
   ListaSubst[ListaSubst.length] = 'texto_geral_imp';   
   ListaPattern[ListaPattern.length] = /(cellspacing="[0-9]" |cellspacing=[0-9]* )/gi  //Ajusta para estilos de impressão
   ListaSubst[ListaSubst.length] = 'cellspacing="0" ';
   ListaPattern[ListaPattern.length] = /(cellpadding="[0-9]" |cellpadding=[0-9]* )/gi  //Ajusta para estilos de impressão
   ListaSubst[ListaSubst.length] = 'cellpadding="0" ';

   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Processos|Ver todas as movimentações|Ver todas as partes e advogados)<\/a>/gi;   
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Notas de Expediente|Ver Audiências)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Sentença|Ver Outras Informações|Ver Dados do 2º Grau)<\/a>/gi;   
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Dados do 1º Grau|Ver Mandados Oficiais)<\/a>/gi;   
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Praças e Leilões|Ver Último Julgamento)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';   
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Termos de Audiência|Ver Alvarás Automatizados Expedidos)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= ''; 
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Termos de Audi&ecirc;ncia)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Guias de Custas|Ver Depósitos Judiciais de 1º grau)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Acórdãos e Decisões Monocráticas|Ver Outras Decisões e Despachos|Ver Depósitos Judiciais)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Ac&oacute;rd&atilde;os e Decis&otilde;es Monocr&aacute;ticas|Ver Outras Decis&otilde;es e Despachos)<\/a>/gi;
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+" target="_blank">(Ver Autos Eletrônicos|Portal do Processo Eletrônico)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /\(requer código de acesso para as PARTES. Sr. ADVOGADO: acesse o \)/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+" target="_blank">(Ver Autos Eletrônicos \(requer código de acesso para as PARTES. Sr. ADVOGADO: acesse o )<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+" target="_blank">(Portal do Processo Eletrônico\))<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length] = /(<a href="[^"]+">|<\/a>)/gi;  // Remove links
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length] = / class=Hit/gi;
   ListaSubst[ListaSubst.length]= '';    
   
   for(a=0;a<ListaSubst.length;a++){
      texto = texto.replace(ListaPattern[a],ListaSubst[a]);
   }
   return texto;

}