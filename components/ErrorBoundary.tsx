import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { logError, generateReport } from "../lib/errors";

type Props = { children: React.ReactNode };
type State = { error: Error | null; expanded: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, expanded: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, { component: info.componentStack ?? undefined, fatal: true });
  }

  handleRestart = () => {
    this.setState({ error: null, expanded: false });
  };

  handleShare = async () => {
    try {
      const report = await generateReport();
      const file = new File(Paths.cache, "fitforge-crash-report.json");
      await file.write(report);
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Share Crash Report",
      });
    } catch {
      // If sharing fails, silently ignore — we're already in a crash state
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="headlineLarge" style={styles.heading}>
            Something went wrong
          </Text>
          <Text variant="bodyMedium" style={styles.sub}>
            The app encountered an unexpected error. You can share a crash
            report to help us fix the issue, or restart the app.
          </Text>

          <Button
            mode="outlined"
            onPress={() => this.setState((s) => ({ expanded: !s.expanded }))}
            style={styles.btn}
            icon={this.state.expanded ? "chevron-up" : "chevron-down"}
          >
            {this.state.expanded ? "Hide Details" : "Show Details"}
          </Button>

          {this.state.expanded && (
            <ScrollView style={styles.stack} nestedScrollEnabled>
              <Text variant="bodySmall" style={styles.mono}>
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </Text>
            </ScrollView>
          )}

          <Button
            mode="contained"
            icon="share-variant"
            onPress={this.handleShare}
            style={styles.btn}
          >
            Share Crash Report
          </Button>

          <Button
            mode="contained-tonal"
            icon="restart"
            onPress={this.handleRestart}
            style={styles.btn}
          >
            Restart
          </Button>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    padding: 24,
    paddingTop: 80,
    alignItems: "center",
  },
  heading: {
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  sub: {
    color: "#aaa",
    marginBottom: 24,
    textAlign: "center",
  },
  btn: {
    marginBottom: 12,
    width: "100%",
  },
  stack: {
    maxHeight: 200,
    width: "100%",
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  mono: {
    fontFamily: "monospace",
    color: "#e0e0e0",
    fontSize: 11,
  },
});
