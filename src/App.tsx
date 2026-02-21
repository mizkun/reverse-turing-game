import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TeaserPage } from "./pages/TeaserPage";
import { EntryPage } from "./pages/EntryPage";
import { BoardPage } from "./pages/BoardPage";
import { ThreadPage } from "./pages/ThreadPage";
import { ResultPage } from "./pages/ResultPage";
import { HostPage } from "./pages/HostPage";
import { CreateRoomPage } from "./pages/CreateRoomPage";
import { MockPage } from "./pages/MockPage";
import "./styles/bbs.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TeaserPage />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/room/:roomId" element={<EntryPage />} />
        <Route path="/room/:roomId/board" element={<BoardPage />} />
        <Route path="/room/:roomId/board/:threadId" element={<ThreadPage />} />
        <Route path="/room/:roomId/result" element={<ResultPage />} />
        <Route path="/host/:hostToken" element={<HostPage />} />
        <Route path="/mock" element={<MockPage />} />
      </Routes>
    </BrowserRouter>
  );
}
