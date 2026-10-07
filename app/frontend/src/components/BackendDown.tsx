import { API_URL } from "@/lib/api";

export default function BackendDown() {
  return (
    <div role="alert" className="alert alert-warning">
      <span>
        The backend at {API_URL} is not answering. Start it with <code>./mvnw spring-boot:run</code>{" "}
        in the <code>app</code> folder.
      </span>
    </div>
  );
}
