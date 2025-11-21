import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Recommendations from "./pages/Recommendations";
import DataImport from "./pages/DataImport";
import Services from "./pages/Services";
import OutreachLog from "./pages/OutreachLog";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/customers"} component={Customers} />
      <Route path={"/customers/:id"} component={CustomerDetail} />
      <Route path={"/recommendations"} component={Recommendations} />
      <Route path={"/import"} component={DataImport} />
      <Route path={"/services"} component={Services} />
      <Route path={"/outreach"} component={OutreachLog} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
