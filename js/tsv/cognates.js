/* Cognate selection panel of the edictor
 *
 * author   : Johann-Mattis List
 * email    : mattis.list@lingulist.de
 * created  : 2014-12-18 14:11
 * modified : 2015-01-27 10:35
 *
 */

/* basic handler class that initiates the multiselect and other functionalities
 * which are later needed for the cognate set panel */
function handle_cognate_selection() {

  /* check whether formatter is true or not */
  if (!CFG['formatter']) {
    return;
  }
  
  /* get selector */
  var slc = document.getElementById('cognates_select_concepts');
  
  /* retrieve concepts and add them to selection */
  var txt = '';
  for (concept in WLS['concepts']) {
    txt += '<option id="concept_'+WLS.c2i[concept]+'" value="'+concept+'">'+concept+'</option>';
  }
  slc.innerHTML = txt;
  slc.options[0].selected = true;
  CFG['_current_concept'] = slc.options[0].value;

  $('#cognates_select_concepts').multiselect({
        disableIfEmtpy: true,
        includeSelectAllOption : true,
        enableFiltering: true,
        maxHeight: window.innerHeight-100,
        buttonClass : 'btn btn-primary mright submit pull-left',
        enableCaseInsensitiveFiltering: true,
        buttonContainer: '<div id="cognates_select_concepts_button" class="select_button" />',
        buttonText: function (options, select) {
          return 'Select Concepts <b class="caret"></b>';
        }
      });

  display_cognates(CFG['_current_concept']);
  document.getElementById('cognates_current_concept').innerHTML = CFG['_current_concept'];
}

/* function displays all cognates in a table and makes them ready for editing */
function display_cognates(concept, sortby) {

  /* check for emtpy sortby */
  if (typeof sortby == 'undefined') {
    sortby = 2;
  }
  
  /* if concept is not passed, check for selection */
  if (typeof concept == 'undefined' || ! concept) {

    /* set up variable for integer ids of concepts to get them passed to the function that
     * handles the restricted file display of the wordlist */
    var selected_concepts = [];
    
    /* get the word ids for the selected concepts */
    var idxs = [];
    var slc = document.getElementById('cognates_select_concepts');
    if (typeof slc == 'undefined' || slc === null) {return;}
    var all_concepts = [];
  
    /* set up restriction to maximally five concepts per slot */
    var restriction = 1
    for (var i=0,option; option=slc.options[i]; i++) {
      if (option.selected && restriction <= 5) {
        for (var j=0,idx; idx=WLS['concepts'][option.value][j]; j++) {
          idxs.push(idx);
        }
	all_concepts.push(option.value);
	selected_concepts.push(WLS.c2i[option.value]);
	restriction += 1;
      }
    }
    if (all_concepts.length > 0) {
      if (all_concepts.length > 1) {
	document.getElementById('cognates_current_concept').innerHTML = all_concepts[0]+', ...';
      }
      else {
	document.getElementById('cognates_current_concept').innerHTML = all_concepts[0];
      }
      /* mark the current concept */
      CFG['_current_concept'] = all_concepts[0];
      CFG['_concept_multiselect'] = true;

      /* make string from selected concepts */
      selected_concepts = selected_concepts.join(',');
    }
    else {
      display_cognates(CFG['_current_concept']);
      return;
    }
  }
  /* if the concept is not undefined, we have to change the multiselect options to display what
   * we really want to see */
  else {
    var idxs = WLS.concepts[concept];
    
    var selected_concepts = ''+WLS.c2i[concept];

    $('#cognates_select_concepts').multiselect('deselectAll',false);
    $('#cognates_select_concepts').multiselect('select',concept);

    /* don't forget to also change the internal options which are not displayed here */
    var slcs = document.getElementById('cognates_select_concepts');
    for (var k=0,option; option=slcs.options[k]; k++) {
      if (option.selected && option.value != concept) {
	option.selected = false;
      }
      else if (option.value == concept) {
	option.selected = true;
      }
    }
    /* store that there is no multiselect option chosen here */
    CFG['_concept_multiselect'] = false;
  }

  /* get the selected concep
  /* add first concept */
  var tab = document.getElementById('cognates_table');
  var txt = '<table id="cognates_alignments" class="alignments">';
  var maxlen = 4;
  
  /* store in data array first */
  var data = [];
  var aidx = CFG['_alignments'];
  var tidx = CFG['_segments'];
  var cidx = CFG['_fidx'];
  
  for (var i=0,idx; idx = idxs[i]; i++) {
    var cid = WLS[idx][cidx];
    
    var tks = WLS[idx][aidx];
    if (!tks) {
      var tks = WLS[idx][tidx];
    }
    var doc = WLS[idx][CFG['_tidx']];
    var con = WLS[idx][CFG['_cidx']];
    
    if (CFG['_selected_doculects'].indexOf(doc) != -1) {
      /* retrieve length of tokens, current solution is not very economic,
       * but it seems to suffice here for the time being */
      var tkl = tks.split(' ');

      /* check for empty tokens */
      //if (tkl != 0) {
      var brackets = 0;
      for (var j=0;j<tkl.length; j++) {
        if (tkl[j] == '(' || tkl[j] == ')'){
          brackets += 1;
        }
      }
      tkl = tkl.length - brackets;
      if (tkl > maxlen) {
        maxlen = tkl;
      }
      data.push([idx,doc,con,cid,tks]);
    }
    
  }

  /* set up a concept string or nothing in case concept is undefined */
  if (typeof concept == 'undefined') {
    var cstring = '';
  }
  else {
    var cstring = concept;
  }

  txt += '<tr>';
  txt += '<th onclick="display_cognates(\''+cstring+'\',1)" class="pointed alm_head alm_bdl">DOCULECT</th>';
  txt += '<th style="width: 5px"></th>';
  txt += '<th onclick="display_cognates(\''+cstring+'\',2)" class="pointed alm_head alm_bdl">CONCEPT</th>';
  txt += '<th style="width:5px" class="alm_bdr"></th>';
  txt += '<th onclick="display_cognates(\''+cstring+'\',4)" class="pointed alm_head" colspan="'+maxlen+'">ALIGNMENTS</th>';
  txt += '<th style="width:5px"></th>';
  txt += '<th onclick="display_cognates(\''+cstring+'\',3)" class="pointed alm_head alm_bdl" colspan="3">EDIT</th></tr>';

  /* sort data according to concept and cognate id and taxon */
  data.sort(
      function(x,y) {
	var _x = [x[3], x[sortby], x[2],x[1]].join(' ');
	var _y = [y[3], y[sortby], y[2],y[1]].join(' ');
	return _x.localeCompare(_y);
      });

  /* determine length of cognate sets */
  var csets = {};
  for (var i=0,row; row=data[i]; i++) {
    if (row[3] in csets){csets[row[3]] += 1;}
    else {csets[row[3]] = 1;}
  }
  
   
  /* retrieve alignments */
  var alms = [];
  var current = 0;
  var color = 'lightgray';
  for (var i=0,row; row=data[i]; i++) {
    if (current != row[3]) {
      txt += '<tr class="d0">';
      txt += '<td colspan="'+(maxlen + 8)+'" style="height:5px;"></td></tr>';
      if (color == 'white') {
	color = '#e0e6f8';
      }
      else {
	color = 'white';
      }
    }
    
    if (row[4] == '-' || row[4] == '') {
      txt += '<tr style="background-color:'+color+';display:none;">';
    }
    else {
    txt += '<tr style="background-color:'+color+'">';
    }
    txt += '<td class="alm_line alm_bdl">'+row[1]+'</td>';
    txt += '<td></td>';
    txt += '<td class="alm_line alm_bdl">'+row[2]+'</td>';
    txt += '<td class="alm_bdr"></td>';
        txt += plotWord(row[4], 'td');   

    alms.push(row[4].split(' '));

    /* add missing tds for the rest of the table */
    var clen = maxlen - row[4].split(' ').length + row[4].replace(/[^\(\)]/g, '').length;
    for (var j=0; j < clen; j++) {
      txt += '<td></td>';
    }
    txt += '<td></td>';
    txt += '<td class="alm_bdl alm_line">'+row[3]+'</td>';
    txt += '<td class="alm_line"><input type="checkbox" id="cognates_idx_'+row[0]+'" value="'+row[0]+'"></input></td>';
   
    if (current != row[3]) {
      txt += '<td class="alm_line" style="width:15px;color:'+color+';background-color:'+color+'" rowspan="'+csets[row[3]]+'">';
      txt += '<button title="align the words" onclick="editGroup(event,\''+row[3]+'\')" class="btn-primary btn mleft submit3">';
      txt += '<span class="icon-bar"></span>';
      txt += '<span class="icon-bar"></span>';
      txt += '</button>';
      txt += '</td>';
      current = row[3];
    }
    else {
      current = row[3];  
    }

    txt += '</tr>';
  }
  txt += '</table>';
  tab.innerHTML = txt;
  
  /* reset wordlist selection to the range of selected concepts */
  if (data.length != 0) {
    filterOccurrences(false, selected_concepts);
  }
}

function display_previous_cognate() {
  
  var ccon = CFG['_current_concept'];
  var acon = Object.keys(WLS.concepts);
  var pcon = acon[(acon.indexOf(ccon)-1)];
  display_cognates(pcon);
  document.getElementById('cognates_current_concept').innerHTML = pcon;
  CFG['_current_concept'] = pcon;
}

function display_next_cognate() {

  var ccon = CFG['_current_concept'];
  var acon = Object.keys(WLS.concepts);
  var ncon = acon[(acon.indexOf(ccon)+1)];
  display_cognates(ncon);

  document.getElementById('cognates_current_concept').innerHTML = ncon;
  CFG['_current_concept'] = ncon;
}

function display_current_cognate() {
  if (!CFG['_concept_multiselect']) {
    var ccon = CFG['_current_concept'];
    display_cognates(ccon);
  }
  else {
    display_cognates();
  }
}

/* get the word indices for all currently selected concepts */
function get_selected_indices() {
  /* get the word ids for the selected concepts */
  var idxs = [];
  var slc = document.getElementById('cognates_select_concepts');

  for (var i=0,option; option=slc.options[i]; i++) {
    if (option.selected) {
      for (var j=0,idx; idx=WLS['concepts'][option.value][j]; j++) {
	idxs.push(idx);
      }
    }
  }
  
  
  var checked = [];
  for (var i=0,idx; idx=idxs[i]; i++) {
    if (document.getElementById('cognates_idx_'+idx).checked) {
      checked.push(idx);
    }
  }

  console.log('checked',checked);

  return checked;
}

/* create a new cognate id for all selected words */
function assign_new_cogid() {
  
  var checked = get_selected_indices();

  /* calculate new cogid */
  var new_cogid = get_new_cogid();
  var cidx = WLS.header.indexOf(CFG['formatter']);
  
  /* we submit all at once now to make it faster */
  var ids = [];
  var cols = [];
  var vals = [];

  for (var i=0,chk; chk=checked[i]; i++) {
    WLS[chk][cidx] = new_cogid;
    
    /* add to remote store arrays */
    ids.push(chk);
    cols.push(cidx);
    vals.push(new_cogid);

  }
  
  /* go for remote store */
  storeModification(ids, cols, vals, false);
  
  /* XXX consider not resetting format here ? XXX */
  resetFormat(CFG['formatter']);
  
  display_cognates();
}

/* create a new combined cognate id for all cognate sets whose
 * representatative words are selected */
function combine_cogids() {

  var checked = get_selected_indices();
  
  var cidx = WLS.header.indexOf(CFG['formatter']);
  
  /* just get the first of all cogids */
  cogid = false;
  for (var i=0;i<checked.length; i++) {
    var tmp_cogid = WLS[checked[i]][cidx];
    if ((!cogid || 0 < tmp_cogid < cogid || cogid == 0) && tmp_cogid && tmp_cogid != 0) {
	cogid = tmp_cogid;
    }
  }
  
  if (!cogid) {
    cogid = get_new_cogid();
  }

  var ids = [];
  var cols = [];
  var vals = [];
  
  var visited = [];
  for (var i=0,chk; chk=checked[i]; i++) {
    console.log(chk, cidx, WLS[chk]);
    var tmp_cogid = parseInt(WLS[chk][cidx]);
    if (visited.indexOf(tmp_cogid) == -1) {
      if (tmp_cogid && tmp_cogid != 0 && typeof tmp_cogid == 'number') {
	for (var j=0,idx; idx=WLS.etyma[tmp_cogid][j]; j++) {
      	  WLS[idx][cidx] = cogid;
      	  
      	  /* store remote if possible */
      	  ids.push(idx);
	  cols.push(cidx);
	  vals.push(cogid);
	  //storeModification(idx, cidx, cogid, false);
      	}
      }
      else {
	WLS[chk][cidx] = cogid;
	ids.push(chk);
	cols.push(cidx);
	vals.push(cogid);
	//storeModification(chk, cidx, cogid, false);
      }
      visited.push(tmp_cogid);
    }
  }

  /* store modification */
  storeModification(ids, cols, vals, false);

  /* XXX consider not resetting the formatter? */
  resetFormat(CFG['formatter']);
  display_cognates();
}

/* get cognate identifier */
function get_new_cogid() {
  if (!CFG['storable']) {
    var etym_len = Object.keys(WLS.etyma).length;
    for (var i=1; i < etym_len+1; i++) {
      if (!(i in WLS.etyma)) {
        return i;
      }
    }
    return etym_len+1;
  }
  else {
    var cogid = false;
    var url = 'triples/triples.py?' +
      'remote_dbase='+CFG['remote_dbase'] +
      '&file='+CFG['filename'] +
      '&new_id='+CFG['formatter']
      ;
    $.ajax({
      async: false,
      type: "GET",
      contentType: "application/text; charset=utf-8",
      url: url,
      dataType: "text",
      success: function(data) {
	cogid=parseInt(data);
      },
      error: function(){
	fakeAlert("problem retrieving a new cognate ID fromt he dbase");
      }
    });
    return cogid;
  }
}
/* function inserts unique ids for unassigned cognate sets */
function cognateIdentifier(cogid) {
  if (isNaN(parseInt(cogid)) || !cogid) {
    var etym_len = Object.keys(WLS.etyma).length;
    for (var i=1; i < etym_len+2; i++) {
      if (!(i in WLS.etyma)) {
        return i;
      }
    }
  }
  return cogid;
}
function partialCognateIdentifier(cogids) {
  var tmp = cogids.split(/\s+/);
  var start = 1;
  var out = [];
  var etym_len = Object.keys(WLS.roots).length + tmp.length + 1;
  for (var i=0;i<tmp.length; i++) {
    if (isNaN(parseInt(tmp[i]))) {
      for (var j=start; j<etym_len; j++) {
	if (!(j in WLS.roots)) {
	  out.push(j);
	  start = j+1;
	  break;
	}
      }
    }
    else {
      out.push(tmp[i])
    }
  }
  return out.join(' ');
}
