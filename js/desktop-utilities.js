/**
 * A simple and easy to debug javascript file that handles the front end interface.
 * I make no use of angular,react or even jQuery its pure old school javascript
 * 
 * LMZ March 2017
 * 
 */
 


const KNOWLEDGEBASE_DIR = "knowledge-base";
const TODO_TEMPLATE = "todo-template.html";

function init() {
  if (config.remote_store) {
    exec("scp -r " + config.user + "@" + config.host + ":" + config.default_dir + "/" + KNOWLEDGEBASE_DIR + "/* ./" + KNOWLEDGEBASE_DIR  , (error, stdout, stderr) => {
      if (error) {
        log.error(`exec error: ${error}`);
        return;
      }
    
      exec("scp -r " + config.user + "@" + config.host + ":" + config.default_dir + "/data/* ./data/"  , (error, stdout, stderr) => {
        if (error) {
          log.error(`exec error: ${error}`);
          return;
        }
      });
    });
  }
}

function syncKB() {
  if (config.remote_store) {
    exec("scp -r ./" + KNOWLEDGEBASE_DIR + "/* " + config.user + "@" + config.host + ":" + config.default_dir + "/" + KNOWLEDGEBASE_DIR + "/"   , (error, stdout, stderr) => {
      if (error) {
        log.error(`exec error: ${error}`);
        return;
      }
    });
  }
}

function syncTodo(format) {
  if (config.remote_store) {
    exec("scp -r ./data/" + format + "/* " + config.user + "@" + config.host + ":" + config.default_dir + "/data/" + format + "/"  , (error, stdout, stderr) => {
      if (error) {
        log.error(`exec error: ${error}`);
        return;
      }
    });
  }
}


/* Simple html include  - really do we need more commenting ? */
function includeHtml() {
  let contents = fs.readFileSync('header.html').toString();
  let header = document.getElementById('header');
  header.innerHTML = contents;
}


/* Build sidebar menu */

/**
 * @description Dynamic menu builder from config.json and cached files 
 * 
 */
function buildMenu() {
  // 2 Level deep traversal only - dont dig it - haters gonna hate - then change it
  
  let dirs = fs.readdirSync("./"+KNOWLEDGEBASE_DIR); 
  let sHtml = "";
  for (let dir = 0; dir < dirs.length ; dir++) {
    let files = fs.readdirSync(KNOWLEDGEBASE_DIR + "/" + dirs[dir]);
    sHtml += kbMenuItem(dirs[dir],files);
  }
  // build the rest
  sHtml += menuItem(TODO_TEMPLATE,'Todo List');
  let el = document.getElementById('sidebar');
  el.innerHTML = mainMenu(sHtml);
}


/**
 * @description Simple menu toggle (expand and close) 
 *
 * @param id - the element to check (clicked)
 * @return void
 * 
 */
function toggleMenu(id) {
  let parent = document.getElementById(id);
  let el = parent.lastChild;
  if (parent.className.indexOf('active') >= 0) {
    el.style.display = "none";
    parent.className = "sub-menu";
  } else {
    el.style.display = "block";
    parent.className = "sub-menu active";
  }
}

/**
 * @description Load html content
 *
 * @param file - the html file to load 
 * @returns void
 */
function loadContent(file) {
  let inline = document.getElementById('template-contents');
  let dateFormatToday = formatDate(0);
  let dateFormatYesterday = formatDate(1);
  let dateYearMonth = formatYearMonth();


  if (file.indexOf('todo') >= 0) {
    // load the template file
    contents = fs.readFileSync("templates/"+ file).toString();
    // add it
    inline.innerHTML = contents
    // check if we have cached data

    try {
      fs.mkdirSync('data/' + dateYearMonth);
    } catch(e) {
      if ( e.code != 'EEXIST' ) throw e;
    }
    
    if (fs.existsSync('data/' + dateYearMonth + '/todo-list-' + dateFormatToday + '.html')) {
      let data = fs.readFileSync('data/' + dateYearMonth + '/todo-list-' + dateFormatToday + '.html').toString();
      let el = document.getElementById('task-list-today');
      el.innerHTML = data;
    }
    if (fs.existsSync('data/' + dateYearMonth + '/todo-list-' + dateFormatYesterday + '.html')) {
      data = fs.readFileSync('data/' + dateYearMonth + '/todo-list-' + dateFormatYesterday + '.html').toString();
      el = document.getElementById('task-list-yesterday');
      el.innerHTML = data;
    }
  }
  let header = document.getElementById('todo-list-header-today');
  header.innerHTML = "Todo List - " + dateFormatToday;
  header = document.getElementById('todo-list-header-yesterday');
  header.innerHTML = "Todo List - " + dateFormatYesterday;
  let actionItems = document.getElementById('action-items');
  actionItems.style.display = "none";
}

/**
 * @description Load template contents
 *
 * @param file - the template file to load 
 * @returns void
 */
function loadTemplateContent(file) {
  let inline = document.getElementById('template-contents');
  contents = fs.readFileSync(KNOWLEDGEBASE_DIR + "/" +file).toString();
  inline.innerHTML = contents;
  let actionItems = document.getElementById('action-items');
  actionItems.style.display = "block";
}


/**
 * @description Save the inline html 
 * 
 * @returns void
 */
function savePage() {
  let inline = document.getElementById('template-contents');
  let clean = inline.innerHTML.replace(new RegExp("&lt;", 'g'), "<").replace(new RegExp("&gt;", 'g'), ">");
  notie.input({
    type: 'text',
    text: 'Please enter the category/filename category is on of [General,Other,Reference,Technical]',
    placeholder: 'General/foo.html',
    value: 'General/foo.html',
    cancelCallback: function (value) {
      notie.alert({ type: 3, text: 'Contents not saved' })
    },
    submitCallback: function (value) {
      fs.writeFileSync("./" + KNOWLEDGEBASE_DIR + "/" + value, inline.innerHTML);
      // sync with remote server
      syncKB();
      // rebuild the sidebar menu
      buildMenu();
    }
  })
}

/**
 * @description Create an inline html form 2 set templates 
 * 
 * @returns void
 */
function createPage() {
  notie.select({
  text:'Select Template Type',
  cancelText: 'Cancel',
  choices: [
    {
      text: 'Simple Template',
      handler: function () {
        console.log('simple');
        contents = fs.readFileSync('templates/simple.html').toString();
        let inline = document.getElementById('template-contents');
        inline.innerHTML = contents;
      }
    },
    {
      type:3,
      text: 'Complex Template',
      handler: function () {
        console.log('complex');
        contents = fs.readFileSync('templates/complex.html').toString();
        let inline = document.getElementById('template-contents');
        inline.innerHTML = contents;
      }
    }
  ]
  })
}

/**
 * @description Set and enable the inline html editor 
 * 
 * @returns void
 */
function editPage() {
  let inline = document.getElementById('template-contents');
  if (editor) {
    editor.setup();
  } else {
    editor = new MediumEditor('.editable');
  }

}

/**
 * @description View the current html contents 
 * 
 * @returns void
 */
function viewPage() {
  let inline = document.getElementById('template-contents');
  let clean = inline.innerHTML.replace(new RegExp("&lt;", 'g'), "<").replace(new RegExp("&gt;", 'g'), ">");
  inline.innerHTML = clean;
  if (editor) {
    editor.destroy();
  }
}

/**
 * @description Add a task 
 * 
 * @returns void
 */
function addTask(day) {
  notie.input({
    type: 'text',
    text: 'Enter a task item with status code (i.e now,today,future) and label type [success,danger,warning,primary,inverse,info] ',
    placeholder: 'A simple task ,now, [success,danger,warning,primary,inverse,info]',
    cancelCallback: function (value) {
      notie.alert({ type: 3, text: 'Task not added' })
    },
    submitCallback: function (value) {
      let dateFormat = formatDate(0);
      let dateYearMonth = formatYearMonth();
      contents = fs.readFileSync('templates/task-template.html').toString();
      let newTask = contents.replace("{{ item }}",value.split(",")[0]).replace("{{ status }}",value.split(",")[1]).replace("{{ label }}",value.split(",")[2]);
      let taskList = document.getElementById('task-list-' + day);
      taskList.innerHTML = taskList.innerHTML + newTask;
      if (day === 'today') {
        dateFormat = formatDate(0);
      } else {
        dateFormat = formatDate(1);
      }
      fs.writeFileSync('data/' + dateYearMonth + '/todo-list-' + dateFormat + '.html', taskList.innerHTML);
      // sync with remote server
      syncTodo(dateYearMonth);
    }
  })
}

/**
 * @description Update a task 
 * 
 * @returns void
 */
function updateTask(control) {
  let el = control.parentNode;
  let title =  el.parentNode.getElementsByClassName('task-title-sp')[0].innerHTML;
  let status = el.parentNode.getElementsByClassName('badge-sm')[0].innerHTML;
  let label = el.parentNode.getElementsByClassName('badge-sm')[0].className.split("label-")[1]
  notie.input({
    type: 'text',
    text: 'Enter a task item with status code (i.e now,today,future) and label type [success,danger,warning,primary,inverse,info] ',
    value: '' + title + ',' + status + ',' + label,
    cancelCallback: function (value) {
      notie.alert({ type: 3, text: 'Task not added' })
    },
    submitCallback: function (value) {
      el.parentNode.getElementsByClassName('task-title-sp')[0].innerHTML = value.split(",")[0];
      el.parentNode.getElementsByClassName('badge-sm')[0].innerHTML = value.split(",")[1];
      el.parentNode.getElementsByClassName('badge-sm')[0].className = "badge badge-sm label-" + value.split(",")[2];
      let dateFormat = formatDate();
      let taskList = document.getElementById('task-list');
      fs.writeFileSync('data/todo-list-' + dateFormat + '.html', taskList.innerHTML);
    }
  })
}

/**
 * @description Complete a task 
 * 
 * @returns void
 */
function completeTask(control) {
  let el = control.parentNode;
  el.parentNode.getElementsByClassName('badge-sm')[0].innerHTML = "Completed";
  el.parentNode.getElementsByClassName('badge-sm')[0].className = "badge badge-sm label-success";
  let dateFormat = formatDate();
  let taskList = document.getElementById('task-list');
  fs.writeFileSync('data/todo-list-' + dateFormat + '.html', taskList.innerHTML);
}

/**
 * @description Format date 
 * 
 * @returns date format as string (yyyymmdd)
 */
function formatDate(day) {
  let date = new Date();
  let mm = (date.getMonth() +1);
  let dd = date.getDate() - day;
  if (mm < 10) mm = "0" + mm;
  if (dd < 10) mm = "0" + dd;
  return "" + date.getFullYear() + mm + dd;
}

/**
 * @description Format date 
 * 
 * @returns date format as string (yyyymm)
 */
function formatYearMonth() {
  let date = new Date();
  let mm = (date.getMonth() +1);
  if (mm < 10) mm = "0" + mm;
  return "" + date.getFullYear() + mm;
}

/** 
 * To be honest anyone viewing the previous comments
 * would be thinking what a load of crock, the functions explain it all 
 * I'm glad we are on the same page :)
 * 
 * Some thoughts
 * 1. Imagine someone writing code with stupid comments - how dare you !!
 * 2. Imagine someone writing code without using a frame work, just pure js - how dare you !!
 * 3. Imagine someone writing code for a desktop app - how dare you !!
 * 4. Ahh forgedda abowd it - Ima gonna hurta sum buddy
 * 
 */

/* Templates as functions */
/* keeping it stupid simple */
function kbMenuItem(dir,files) {
  let sHtml = `<li class="sub-menu" id="${dir}">
  <a href="javascript:toggleMenu('${dir}');">
    <i class="fa fa-book"></i>
    <span>KB - ${dir}</span>
    <span class="dcjq-icon"></span>
  </a>
  <ul class="sub" style="display:none">`;
  for (let file = 0; file < files.length; file++) {
    sHtml += kbMenuSubItem(dir,files[file]);
  }
  return sHtml + "</ul>";
}

function kbMenuSubItem(dir,file) {
  return `<li>
    <a href=\"javascript:loadTemplateContent('${dir}/${file}');">
      <span>${file}</span>
    </a>
   </li>`;
}

function menuItem(file,title) {
  return `<li class="sub-menu" >
    <a href="javascript:loadContent('${file}')";>
      <i class="fa fa-cogs"></i>
      <span>${title}</span>
      <span class="dcjq-icon"></span>
    </a>
  </li>`;
}

function mainMenu(html) {
  return `<ul class="sidebar-menu" id="nav-accordion">${html}</ul>`;
}