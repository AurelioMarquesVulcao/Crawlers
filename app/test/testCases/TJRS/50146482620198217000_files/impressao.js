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
   ListaPattern[ListaPattern.length] = / bgColor\=("\#[0-9ABCDEFabcdef]{6}"|\#[0-9ABCDEFabcdef]{6})/gi;  // Remove as cores das c�lulas
   ListaSubst[ListaSubst.length]= '';
   ListaPattern[ListaPattern.length] = /texto_geral/gi  //Ajusta para estilos de impress�o
   ListaSubst[ListaSubst.length] = 'texto_geral_imp';   
   ListaPattern[ListaPattern.length] = /(cellspacing="[0-9]" |cellspacing=[0-9]* )/gi  //Ajusta para estilos de impress�o
   ListaSubst[ListaSubst.length] = 'cellspacing="0" ';
   ListaPattern[ListaPattern.length] = /(cellpadding="[0-9]" |cellpadding=[0-9]* )/gi  //Ajusta para estilos de impress�o
   ListaSubst[ListaSubst.length] = 'cellpadding="0" ';

   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Processos|Ver todas as movimenta��es|Ver todas as partes e advogados)<\/a>/gi;   
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Notas de Expediente|Ver Audi�ncias)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Senten�a|Ver Outras Informa��es|Ver Dados do 2� Grau)<\/a>/gi;   
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Dados do 1� Grau|Ver Mandados Oficiais)<\/a>/gi;   
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Pra�as e Leil�es|Ver �ltimo Julgamento)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';   
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Termos de Audi�ncia|Ver Alvar�s Automatizados Expedidos)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= ''; 
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Termos de Audi&ecirc;ncia)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Guias de Custas|Ver Dep�sitos Judiciais de 1� grau)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Ac�rd�os e Decis�es Monocr�ticas|Ver Outras Decis�es e Despachos|Ver Dep�sitos Judiciais)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+">(Ver Ac&oacute;rd&atilde;os e Decis&otilde;es Monocr&aacute;ticas|Ver Outras Decis&otilde;es e Despachos)<\/a>/gi;
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+" target="_blank">(Ver Autos Eletr�nicos|Portal do Processo Eletr�nico)<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /\(requer c�digo de acesso para as PARTES. Sr. ADVOGADO: acesse o \)/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+" target="_blank">(Ver Autos Eletr�nicos \(requer c�digo de acesso para as PARTES. Sr. ADVOGADO: acesse o )<\/a>/gi;      
   ListaSubst[ListaSubst.length]= '';
   
   ListaPattern[ListaPattern.length]  = /<a href="[^"]+" target="_blank">(Portal do Processo Eletr�nico\))<\/a>/gi;      
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