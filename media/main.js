// the webview can't talk to tilt directly because of CORS, so it has to send a message to the extension
// and have vscode make the call for it
const vscode = acquireVsCodeApi();
function triggerResource(name) {
  vscode.postMessage({command: 'triggerResource', resourceName: name});
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

function setGif(uriBase) {
  console.log('1');
  let e = document.getElementById('status-gif');
  console.log('2');
  let img = document.createElement('img');
  currentGooseState = getNextState();

  const loopMode = currentGooseState === GooseState.waiting || currentGooseState === GooseState.honkedAndWaiting || currentGooseState === GooseState.absent;
  console.log('currentGooseState', currentGooseState, 'loopMode', loopMode);
  const gifState = currentGooseState;
  let options = {
    gif: img,
    progressbar_height: 0,
    draw_while_loading: 0,
    loop_mode: loopMode,
  };

  console.log('3');

  console.log('current', currentGooseState, 'desired', desiredGooseState);
  if (currentGooseState !== GooseState.absent) {
    console.log('4');
    const gif = GooseGifs[currentGooseState];
    console.log('playing', gif);
    img.setAttribute('rel:animated_src', uriBase + '/' + gif + '.gif');

    if (!loopMode) {
      pendingCallback = true;
      options.on_end = () => {
        try {
          console.log('on_end for goose state', gifState);
          pendingCallback = false;
          const nextState = getNextState();
          if (nextState !== currentGooseState) {
            setGif(uriBase);
          }
        } catch (err) {
          console.log('error in on_end', err);
        }
      };
    }
  }
  console.log('5');

  img.setAttribute('rel:autoplay', '0');
  e.replaceChildren(img);

  let g = new SuperGif(options);
  g.load();
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

function updateGif(session, uriBase) {
  let newStatus = aggregateStatus(session);
  console.log('lastStatus', lastStatus, 'newStatus', newStatus);
  if (lastStatus !== Status.error && newStatus === Status.error) {
    desiredGooseState = GooseState.honkedAndWaiting;
  } else if (newStatus === Status.ok) {
    desiredGooseState = GooseState.absent;
  }
  console.log('desired state is now', desiredGooseState);
  console.log('pendingCallback', pendingCallback);
  if (!pendingCallback) {
    setGif(uriBase);
  }
  lastStatus = newStatus;
}

function handleEvent(event, uriBase) {
  const message = event.data;
  try {
    switch (message.command) {
      case 'setSession':
        updateTable(message.session);
        updateGif(message.session, uriBase);
        break;
    }
  } catch (err) {
    console.log('error handling message', err);
  }
}