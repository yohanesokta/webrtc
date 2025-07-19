const socket = io("https://webrtc-znjg.vercel.app");
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const YOUR_LOCAL_IP = 'https://coturn.yohanes.dpdns.org'; // Pastikan IP ini masih benar
let otherUser; // Variabel untuk menyimpan ID pengguna lain

const peerConnection = new RTCPeerConnection({
    iceServers:
        [
            {
                "urls": "stun:stun.relay.metered.ca:80"
            },
            {
                "urls": "turn:standard.relay.metered.ca:80",
                "username": "e651696018cad66ae03380eb",
                "credential": "ckdfpGoJAadR+Twh"
            },
            {
                "urls": "turn:standard.relay.metered.ca:80?transport=tcp",
                "username": "e651696018cad66ae03380eb",
                "credential": "ckdfpGoJAadR+Twh"
            },
            {
                "urls": "turn:standard.relay.metered.ca:443",
                "username": "e651696018cad66ae03380eb",
                "credential": "ckdfpGoJAadR+Twh"
            },
            {
                "urls": "turns:standard.relay.metered.ca:443?transport=tcp",
                "username": "e651696018cad66ae03380eb",
                "credential": "ckdfpGoJAadR+Twh"
            }
        ]
});

let localStream;
const roomId = 'default-room';

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => {
            peerConnection.addTrack(track, stream);
        });
        socket.emit('join-room', roomId);
    })
    .catch(error => {
        console.error('Error accessing media devices.', error);
    });

socket.on('user-joined', (userId) => {
    console.log('Pengguna lain bergabung:', userId);
    otherUser = userId; // Simpan ID pengguna lain di sini

    peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
            socket.emit('offer', { target: otherUser, sdp: peerConnection.localDescription });
        })
        .catch(e => console.error(e));
});

socket.on('offer', (payload) => {
    console.log('Menerima offer dari:', payload.from);
    otherUser = payload.from; // Simpan juga ID pembuat offer

    peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        .then(() => peerConnection.createAnswer())
        .then(answer => peerConnection.setLocalDescription(answer))
        .then(() => {
            socket.emit('answer', { target: otherUser, sdp: peerConnection.localDescription });
        })
        .catch(e => console.error(e));
});

socket.on('answer', (payload) => {
    console.log('Menerima answer dari:', payload.from);
    peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        .catch(e => console.error(e));
});

// --- PERBAIKAN UTAMA DI SINI ---
peerConnection.onicecandidate = (event) => {
    if (event.candidate && otherUser) {
        // Gunakan variabel otherUser yang sudah disimpan
        socket.emit('ice-candidate', {
            target: otherUser,
            candidate: event.candidate
        });
    }
};

socket.on('ice-candidate', (payload) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate))
        .catch(e => console.error(e));
});

peerConnection.ontrack = (event) => {
    console.log('Menerima remote track');
    remoteVideo.srcObject = event.streams[0];
};
