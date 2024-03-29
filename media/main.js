// the webview can't talk to tilt directly because of CORS, so it has to send a message to the extension
// and have vscode make the call for it
const vscode = acquireVsCodeApi();
function triggerResource(name) {
  vscode.postMessage({command: 'triggerResource', resourceName: name});
}

const uriBase = document.currentScript.src.split('/').slice(0, -1).join("/");

function honk() {
  vscode.postMessage({command: 'honk'});
}

var GooseState = {
  absent: 0,
  walkingIn: 1,
  honking: 2,
  honkedAndWaiting: 3,
  waiting: 4,
  walkingOut: 5,
};

const x = 1;

var GooseGifs = {
  [GooseState.absent]: '',
  [GooseState.walkingIn]: 'walk-in',
  [GooseState.honking]: 'honk',
  [GooseState.walkingOut]: 'walk-out',
  [GooseState.honkedAndWaiting]: 'waiting',
  [GooseState.waiting]: 'waiting',
};

var currentGooseState = GooseState.absent;
var desiredGooseState = GooseState.absent;

function getNextState() {
  switch (desiredGooseState) {
    case GooseState.absent:
      switch (currentGooseState) {
        case GooseState.honking:
        case GooseState.honkedAndWaiting:
        case GooseState.waiting:
        case GooseState.walkingIn:
          return GooseState.walkingOut;
        case GooseState.walkingOut:
        case GooseState.absent:
          return GooseState.absent;
      }
      break;
    case GooseState.honkedAndWaiting:
      switch (currentGooseState) {
        case GooseState.absent:
        case GooseState.walkingOut:
          return GooseState.walkingIn;
        case GooseState.honking:
        case GooseState.honkedAndWaiting:
          return GooseState.honkedAndWaiting;
        case GooseState.waiting:
        case GooseState.walkingIn:
          return GooseState.honking;
      }
      break;
  }
  console.log("no next state. current", currentGooseState, "desired", desiredGooseState);
}

function setGif() {
  let e = document.getElementById('status-gif');
  if (!e) {
    return;
  }
  let img = document.createElement('img');
  img.style.display = 'none';
  const prevGooseState = currentGooseState;
  currentGooseState = getNextState();

  const loopMode = currentGooseState === GooseState.waiting || currentGooseState === GooseState.honkedAndWaiting || currentGooseState === GooseState.absent;
  const gifState = currentGooseState;
  let options = {
    gif: img,
    progressbar_height: 0,
    draw_while_loading: 0,
    loop_mode: loopMode,
    c_w: 128,
    c_h: 128,
  };

  if (currentGooseState !== GooseState.absent) {
    const gif = GooseGifs[currentGooseState];
    img.setAttribute('rel:animated_src', uriBase + '/' + gif + '.gif');

    if (!loopMode) {
      pendingCallback = true;
      options.on_end = () => {
        try {
          pendingCallback = false;
          const nextState = getNextState();
          if (nextState !== currentGooseState) {
            setGif();
          }
        } catch (err) {
          console.log('error in on_end', err);
        }
      };
    }
  } else {
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }
  }
  img.setAttribute('rel:autoplay', '0');
  e.appendChild(img);

  let g = new SuperGif(options);
  g.load(() => {
    // perform the swap in the callback after the gif is loaded so we don't get a black flash while the
    // gif loads
    if (e.firstChild !== e.lastChild) {
      e.removeChild(e.firstChild);
    }
    e.lastChild.style.display = '';
    if (prevGooseState === GooseState.walkingIn && currentGooseState === GooseState.honking) {
      honk();
    }
  });
  e.lastChild.style.display = 'none';
}

var Status = {
  error: 'error',
  ok: 'ok',
  pending: 'pending',
  unknown: 'unknown',
  disabled: 'disabled'
};

function targetStatus(target) {
  if (target.state.waiting) {
      return Status.pending;
  }

  if (target.state.active) {
      if (target.type === 'job' || !target.state.active.ready) {
          return Status.pending;
      }
      return Status.ok;
  }

  if (target.state.terminated) {
      // HACK: finish time is sometimes undefined, so just pick start time instead
      const time = target.state.terminated.finishTime || target.state.terminated.startTime;
      if (target.type === 'server' || target.state.terminated.error) {
          return Status.error;
      }
      return Status.ok;
  }

  return Status.disabled;
}

function aggregateStatus(session) {
  if (!session || !session.status || !session.status.targets || !session.status.targets.length) {
    return Status.unknown;
  }
  const statuses = session.status.targets.map(targetStatus);
  if (!statuses) {
      return Status.unknown;
  } if (statuses.includes(Status.error)) {
      return Status.error;
  } else if (statuses?.includes(Status.pending)) {
      return Status.pending;
  } else {
      return Status.ok;
  }
}

function makeTableRow(target) {
  let row = document.createElement('tr');
  let n = document.createElement('td');
  n.innerText = target.name;
  row.appendChild(n);
  let s = document.createElement('td');
  let status = targetStatus(target);
  s.innerText = status;
  let color = 'black';
  switch (status) {
    case 'ok':
      color = 'green';
      break;
    case 'pending':
      color = 'yellow';
      break;
    case 'error':
      color = 'red';
      break;
  }
  s.style.color = color;
  row.appendChild(s);
  let b = document.createElement('td');
  if (target.resources.length) {
    let button = document.createElement('button');
    button.style.background = 'transparent';
    button.style.border = 'none';
    button.innerText = '🔄';
    let resourceName = target.resources[0];
    button.onclick = function() {
      triggerResource(resourceName);
    };
    b.appendChild(button);
  }
  row.appendChild(b);
  return row;
}

function makeTable(session) {
  if (session === undefined) {
    let ret = document.createElement('span');
    ret.innerText = 'Waiting for Tilt API...';
    return ret;
  }
  let table = document.createElement('table');
  if (session && session.status.targets) {
    session.status.targets.forEach((target) => {
      table.appendChild(makeTableRow(target));
    });
  }
  return table;
}

function updateTable(session) {
  let e = document.getElementById('status-table');
  let table = makeTable(session);
  e.replaceChildren(table);
}

var lastStatus = Status.ok;
var pendingCallback = false;

function updateGif(session) {
  let newStatus = aggregateStatus(session);
  if (lastStatus !== Status.error && newStatus === Status.error) {
    desiredGooseState = GooseState.honkedAndWaiting;
  } else if (newStatus === Status.ok) {
    desiredGooseState = GooseState.absent;
  }
  if (!pendingCallback) {
    setGif();
  }
  lastStatus = newStatus;
}

function handleEvent(event) {
  const message = event.data;
  try {
    switch (message.command) {
      case 'setSession':
        updateTable(message.session);
        updateGif(message.session);
        break;
    }
  } catch (err) {
    console.log('error handling message', err);
  }
}

function hackThePlanet() {
  window.onload = () => {
    var script = document.createElement('script');
    script.src = uriBase + '/libgif/libgif.js';
    script.onload = () => {
      var gifSpan = document.createElement('span');
      gifSpan.id = 'status-gif';
      const tableSpan = document.getElementById('status-table');
      tableSpan.parentElement.insertBefore(gifSpan, tableSpan);
      setGif();
    };
  
    document.getElementsByTagName("head")[0].appendChild(script);
  };
}