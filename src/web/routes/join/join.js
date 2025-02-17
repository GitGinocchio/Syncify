function joinroom(roomid) {
    const joinform = document.getElementById('join-form');
    const roomidInput = document.getElementById('roomidInput');
    roomidInput.value = roomid;
    joinform.submit();
};