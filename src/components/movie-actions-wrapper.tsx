"use client";

import { Component, ReactNode } from "react";
import { MovieActions } from "./movie-actions";
import type { FilmItem } from "@/lib/api";

interface Props {
  movie: FilmItem;
}

interface State {
  hasError: boolean;
}

export class MovieActionsWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("[MovieActionsWrapper] Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Nếu có lỗi, không hiển thị gì hoặc hiển thị fallback
      return null;
    }

    return <MovieActions movie={this.props.movie} />;
  }
}

