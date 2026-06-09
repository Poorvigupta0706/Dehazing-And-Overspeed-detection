import { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
} from "@mui/material";

interface Analytics {
  total_vehicles: number;
  average_speed: number;
  max_speed: number;
  overspeed_count: number;
}

function App() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(
        "http://127.0.0.1:8000/analytics"
      );

      setAnalytics(response.data);
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h3" sx={{ mt: 4 }}>
        🚗 AI Traffic Monitoring & Dehazing Dashboard
      </Typography>

      <Typography color="text.secondary">
        YOLOv8 • DeepSORT • AOD-Net • FastAPI • React • Docker
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Total Vehicles
              </Typography>

              <Typography variant="h4">
                {analytics?.total_vehicles ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Average Speed
              </Typography>

              <Typography variant="h4">
                {analytics?.average_speed?.toFixed(2) ?? 0} km/h
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Max Speed
              </Typography>

              <Typography variant="h4">
                {analytics?.max_speed ?? 0} km/h
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                Overspeed Vehicles
              </Typography>

              <Typography variant="h4">
                {analytics?.overspeed_count ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Container>
  );
}
export default App;