import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";
import "./App.css";

const socket = io.connect("http://localhost:8081");

const App = () => {
  const [stream, setStream] = useState();
  const [oppoID, setOppoID] = useState("");
  const [myID, setMyID] = useState("");
  const [caller, setCaller] = useState("");
  const [receivingCall, setReceivingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callerSignal, setCallerSignal] = useState();
  const myVideo = useRef();
  const userVideo = useRef();
  const connection = useRef();
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });

    socket.on("getid", (id) => {
      setMyID(id);
    });

    socket.on("caller", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });
  }, []);

  const calling = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("caller", {
        ToCall: oppoID,
        signalData: data,
        from: myID,
      });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    socket.on("acceptcall", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
    connection.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    peer.signal(callerSignal);
    connection.current = peer;
  };

  return (
    <>
      <div className="App">
        <p>Your ID : {myID}</p>
        <p>write id you want to connected</p>
        <input
          type="text"
          value={oppoID}
          onChange={(e) => setOppoID(e.target.value)}
        />
        <button onClick={calling}>voice call</button>
        <br />
        {receivingCall && !callAccepted ? (
          <div>
            <p>who want to talk with you</p>
            <button onClick={answerCall}>answer call</button>
          </div>
        ) : null}
        <hr />
        <p>=== connected status ===</p>
        {(function () {
          if (receivingCall) {
            return <p>connected</p>;
          } else {
            return <p>not connected</p>;
          }
        })()}
      </div>
      {/**if you want to screen chat display delete */}
      <div style={{ display: "none" }}>
        <div className="video">
          {stream && (
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              style={{ width: "300px" }}
            />
          )}
        </div>
        <div className="video">
          {callAccepted ? (
            <video
              playsInline
              ref={userVideo}
              autoPlay
              style={{ width: "300px" }}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};

export default App;
