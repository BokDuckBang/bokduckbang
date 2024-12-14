// When the Devvit app sends a message with `context.ui.webView.postMessage`, this will be triggered


// window.onload = () => {
  console.log('windwo', window.parent)
  console.log(window.parent.postMessage)
  window.parent.postMessage(
    {
      type: 'ready',
      // data: { newCounter: Number(counter + 1) },
    },
    '*'
  );

  setTimeout(() => {
    console.log('message!'),
    window.parent.postMessage(
      {
        type: 'new',
        // data: { newCounter: Number(counter + 1) },
      },
      '*'
    );
  }, 1000)
// }

window.addEventListener('message', (ev) => {
  console.log('message', ev);
  const { type, data } = ev.data;

  if (type === 'devvit-message') {
    const { message } = data;
    const { type, payload } = message;
    if (type === 'init-data') {
      console.log(payload);
      const untilDate = new Date(payload.until);
      
      document.getElementById('until').innerHTML = untilDate.toLocaleString();
    }
  }
  


  // // Reserved type for messages sent via `context.ui.webView.postMessage`
  // if (type === 'devvit-message') {
  //   const { message } = data;

  //   // Load initial data
  //   if (message.type == 'initialData') {
  //     const { username, currentCounter } = message.data;
  //     usernameLabel.innerHTML = username;
  //     counterLabel.innerHTML = counter = currentCounter;
  //   }

  //   // Update counter
  //   if (message.type == 'updateCounter') {
  //     const { currentCounter } = message.data;
  //     counterLabel.innerHTML = counter = currentCounter;
  //   }
  // }
});