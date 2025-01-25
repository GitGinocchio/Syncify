function joinroom(roomid) {
    const joinform = document.getElementById('join-form');
    const roomidInput = document.getElementById('roomidInput');
    roomidInput.value = roomid;
    joinform.submit();
};

document.addEventListener('DOMContentLoaded', (event) => {
    const roomsContainer = document.getElementById('public-sessions');
    const socket = io('/join');

    socket.on('add_room', function(room){
        const roomElement = document.createElement('div');
        const nosessionsElement = document.getElementById('nosession');
        roomElement.classList.add('session');
        roomElement.id = room.id;
        roomElement.innerHTML = `
        <div class="headerS">
          <p class="session-name">${room.name}</p>
          <p class="session-creator">Created by: ${room.creator.name}</p>
        </div>
        <div class="infoplusS">
          <p class="session-queue">Editable queue: ${room.editablequeue}</p>
        </div>
        <div class="footerS">
          <button class="session-join" onclick="joinroom('${ room.id }')" href="/room">Join</button>
          <p class="session-members">${room.num_members} / ${room.userlimit} Members</p>
        </div>
        `;
        if (roomsContainer) { roomsContainer.appendChild(roomElement); }
        if (nosessionsElement) { nosessionsElement.remove(); }
    });

    socket.on('del_room', function(roomid){
        let roomElement = document.getElementById(roomid);
        if (roomElement) { roomElement.remove(); }

        if (roomsContainer.childNodes.length === 4) {     // Non so il motivo ma ci sono 4 elementi...
            const nosession = document.createElement('p');
            nosession.classList.add('nosession');
            nosession.id = 'nosession';
            nosession.textContent = 'There are no existing public rooms!';
            roomsContainer.appendChild(nosession);
        }
    });

    socket.on('update_member_count',function(room) {
        let roomElement = document.getElementById(room.id);
        if (roomElement) {
            const roomMembers = roomElement.querySelector('.session-members');
            if (roomMembers) {
                roomMembers.textContent = `${room.num_members} / ${room.userlimit} Members`;
            }
        }
    });
});