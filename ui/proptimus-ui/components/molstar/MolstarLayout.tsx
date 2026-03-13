/**
 * Copyright (c) 2018-2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @author Christian Dominguez <christian.99dominguez@gmail.com>
 * @author Ventura Rivera <venturaxrivera@gmail.com>
 */

import { List } from "immutable";
import { OpenFiles } from "molstar/lib/mol-plugin-state/actions/file";
import { PluginUIComponent } from "molstar/lib/mol-plugin-ui/base";
import { PluginUIContext } from "molstar/lib/mol-plugin-ui/context";
import {
  AnimationViewportControls,
  DefaultStructureTools,
  LociLabels,
  SelectionViewportControls,
  StateSnapshotViewportControls,
  TrajectoryViewportControls,
  ViewportSnapshotDescription,
} from "molstar/lib/mol-plugin-ui/controls";
import { useBehavior } from "molstar/lib/mol-plugin-ui/hooks/use-behavior";
import { LeftPanelControls } from "molstar/lib/mol-plugin-ui/left-panel";
import { SequenceView } from "molstar/lib/mol-plugin-ui/sequence";
import {
  BackgroundTaskProgress,
  OverlayTaskProgress,
} from "molstar/lib/mol-plugin-ui/task";
import { Toasts } from "molstar/lib/mol-plugin-ui/toast";
import { Viewport, ViewportControls } from "molstar/lib/mol-plugin-ui/viewport";
import { PluginCommands } from "molstar/lib/mol-plugin/commands";
import { formatTime } from "molstar/lib/mol-util";
import { Asset } from "molstar/lib/mol-util/assets";
import { LogEntry } from "molstar/lib/mol-util/log-entry";
import * as React from "react";
import { JSX } from "react";
import { BehaviorSubject } from "rxjs";
import { ColorLegend } from "./ColorLegend";

type RegionKind = "top" | "left" | "right" | "bottom" | "main";

export class Layout extends PluginUIComponent {
  componentDidMount() {
    this.subscribe(this.plugin.layout.events.updated, () => this.forceUpdate());
  }

  region(kind: RegionKind, Element?: React.ComponentClass | React.FC) {
    return (
      <div className={`msp-layout-region msp-layout-${kind}`}>
        <div className="msp-layout-static">{Element ? <Element /> : null}</div>
      </div>
    );
  }

  get layoutVisibilityClassName() {
    const layout = this.plugin.layout.state;
    const controls = this.plugin.spec.components?.controls ?? {};

    const classList: string[] = [];
    if (
      controls.top === "none" ||
      // Sequence viewer (top) is always shown unless explicitly hidden
      // !layout.showControls ||
      layout.regionState.top === "hidden"
    ) {
      classList.push("msp-layout-hide-top");
    }

    // Hide sequence status bar when controls are hidden
    if (!layout.showControls) {
      classList.push("msp-hide-sequence-status");
    }

    if (
      controls.left === "none" ||
      !layout.showControls ||
      layout.regionState.left === "hidden"
    ) {
      classList.push("msp-layout-hide-left");
    } else if (layout.regionState.left === "collapsed") {
      classList.push("msp-layout-collapse-left");
    }

    if (
      controls.right === "none" ||
      !layout.showControls ||
      layout.regionState.right === "hidden"
    ) {
      classList.push("msp-layout-hide-right");
    }

    if (
      controls.bottom === "none" ||
      !layout.showControls ||
      layout.regionState.bottom === "hidden"
    ) {
      classList.push("msp-layout-hide-bottom");
    }

    return classList.join(" ");
  }

  get layoutClassName() {
    const layout = this.plugin.layout.state;

    const classList: string[] = ["msp-plugin-content"];
    if (layout.isExpanded) {
      classList.push("msp-layout-expanded");
    } else {
      classList.push(
        "msp-layout-standard",
        `msp-layout-standard-${layout.controlsDisplay}`
      );
    }

    return classList.join(" ");
  }

  onDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();

    const files: File[] = [];
    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        if (ev.dataTransfer.items[i].kind !== "file") continue;
        const file = ev.dataTransfer.items[i].getAsFile();
        if (file) files.push(file);
      }
    } else {
      for (let i = 0; i < ev.dataTransfer.files.length; i++) {
        const file = ev.dataTransfer.files[i];
        if (file) files.push(file);
      }
    }

    const sessions = files.filter((f) => {
      const fn = f.name.toLowerCase();
      return fn.endsWith(".molx") || fn.endsWith(".molj");
    });

    if (sessions.length > 0) {
      PluginCommands.State.Snapshots.OpenFile(this.plugin, {
        file: sessions[0],
      });
    } else {
      this.plugin.runTask(
        this.plugin.state.data.applyAction(OpenFiles, {
          files: files.map((f) => Asset.File(f)),
          format: { name: "auto", params: {} },
          visuals: true,
        })
      );
    }
  };

  onDragOver = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
  };

  private showDragOverlay = new BehaviorSubject(false);
  onDragEnter = (ev: React.DragEvent<HTMLDivElement>) => {
    let hasFile = false;
    if (ev.dataTransfer.items && ev.dataTransfer.items.length > 0) {
      for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        if (ev.dataTransfer.items[i].kind !== "file") continue;
        hasFile = true;
        break;
      }
    } else {
      for (let i = 0; i < ev.dataTransfer.types.length; i++) {
        if (ev.dataTransfer.types[i] !== "Files") continue;
        hasFile = true;
        break;
      }
    }

    if (hasFile) {
      this.showDragOverlay.next(true);
    }
  };

  render() {
    const layout = this.plugin.layout.state;
    const controls = this.plugin.spec.components?.controls || {};
    const viewport =
      this.plugin.spec.components?.viewport?.view || DefaultViewport;
    const sequenceView =
      this.plugin.spec.components?.sequenceViewer?.view || SequenceView;

    return (
      <div className="msp-plugin">
        <div className={this.layoutClassName} onDragEnter={this.onDragEnter}>
          <div className={this.layoutVisibilityClassName}>
            {this.region("main", viewport)}
            {
              // Sequence viewer is always shown
              // layout.showControls &&
              controls.top !== "none" &&
                this.region("top", controls.top || sequenceView)
            }
            {layout.showControls &&
              controls.left !== "none" &&
              this.region("left", controls.left || LeftPanelControls)}
            {layout.showControls &&
              controls.right !== "none" &&
              this.region("right", controls.right || ControlsWrapper)}
            {layout.showControls &&
              controls.bottom !== "none" &&
              this.region("bottom", controls.bottom || Log)}
          </div>
          {!this.plugin.spec.components?.hideTaskOverlay && (
            <OverlayTaskProgress />
          )}
          {!this.plugin.spec.components?.disableDragOverlay && (
            <DragOverlay
              plugin={this.plugin}
              showDragOverlay={this.showDragOverlay}
            />
          )}
        </div>
      </div>
    );
  }
}

function dropFiles(
  ev: React.DragEvent<HTMLDivElement>,
  plugin: PluginUIContext,
  showDragOverlay: BehaviorSubject<boolean>
) {
  ev.preventDefault();
  ev.stopPropagation();
  showDragOverlay.next(false);

  const files: File[] = [];
  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
      if (ev.dataTransfer.items[i].kind !== "file") continue;
      const file = ev.dataTransfer.items[i].getAsFile();
      if (file) files.push(file);
    }
  } else {
    for (let i = 0; i < ev.dataTransfer.files.length; i++) {
      const file = ev.dataTransfer.files[i];
      if (file) files.push(file);
    }
  }

  plugin.managers.dragAndDrop.handle(files);
}

function DragOverlay({
  plugin,
  showDragOverlay,
}: {
  plugin: PluginUIContext;
  showDragOverlay: BehaviorSubject<boolean>;
}) {
  const show = useBehavior(showDragOverlay);

  const preventDrag = (e: React.DragEvent) => {
    e.dataTransfer.dropEffect = "copy";
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="msp-drag-drop-overlay"
      style={{ display: show ? "flex" : "none" }}
      onDragEnter={preventDrag}
      onDragOver={preventDrag}
      onDragLeave={() => showDragOverlay.next(false)}
      onDrop={(e) => dropFiles(e, plugin, showDragOverlay)}
    >
      Load File(s)
    </div>
  );
}

export class ControlsWrapper extends PluginUIComponent {
  render() {
    const StructureTools =
      this.plugin.spec.components?.structureTools || DefaultStructureTools;
    return (
      <div className="msp-scrollable-container">
        <StructureTools />
      </div>
    );
  }
}

export class DefaultViewport extends PluginUIComponent {
  render() {
    const VPControls =
      this.plugin.spec.components?.viewport?.controls || ViewportControls;
    const SVPControls =
      this.plugin.spec.components?.selectionTools?.controls ||
      SelectionViewportControls;
    const SnapshotDescription =
      this.plugin.spec.components?.viewport?.snapshotDescription ||
      ViewportSnapshotDescription;

    return (
      <>
        <Viewport />
        <div className="msp-viewport-top-left-controls">
          <AnimationViewportControls />
          <TrajectoryViewportControls />
          <StateSnapshotViewportControls />
          <SnapshotDescription />
        </div>
        <SVPControls />
        <VPControls />
        <BackgroundTaskProgress />
        <div className="msp-highlight-toast-wrapper">
          <LociLabels />
          <Toasts />
        </div>
        <ColorLegend />
      </>
    );
  }
}

export class Log extends PluginUIComponent<{}, { entries: List<LogEntry> }> {
  private wrapper = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.subscribe(this.plugin.events.log, () =>
      this.setState({ entries: this.plugin.log.entries })
    );
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  state = { entries: this.plugin.log.entries };

  private scrollToBottom() {
    const log = this.wrapper.current;
    if (log) log.scrollTop = log.scrollHeight - log.clientHeight - 1;
  }

  render() {
    // TODO: ability to show full log
    // showing more entries dramatically slows animations.
    const maxEntries = 10;
    const xs = this.state.entries,
      l = xs.size;
    const entries: JSX.Element[] = [];
    for (let i = Math.max(0, l - maxEntries), o = 0; i < l; i++) {
      const e = xs.get(i);
      entries.push(
        <li key={o++}>
          <div className={"msp-log-entry-badge msp-log-entry-" + e!.type} />
          <div className="msp-log-timestamp">{formatTime(e!.timestamp)}</div>
          <div className="msp-log-entry">{e!.message}</div>
        </li>
      );
    }
    return (
      <div
        ref={this.wrapper}
        className="msp-log"
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
          overflowY: "auto",
        }}
      >
        <ul className="msp-list-unstyled">{entries}</ul>
      </div>
    );
  }
}
