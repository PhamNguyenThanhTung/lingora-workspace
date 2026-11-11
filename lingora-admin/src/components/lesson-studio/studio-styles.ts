// Lingora Studio Styles mapping & Embedded CSS for isolated test & Next.js compatibility

export const studioCss = `
.studioLayout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.studioHeaderBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.studioHeaderLeft {
  display: flex;
  align-items: center;
  gap: 10px;
}

.studioFormatBadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  border: 1px solid #bfdbfe;
}

.studioViewTabs {
  display: none;
  gap: 4px;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 6px;
}

.studioColumns {
  display: grid;
  grid-template-columns: 220px minmax(320px, 1fr) minmax(300px, 380px);
  gap: 16px;
  align-items: start;
  max-width: 100%;
  box-sizing: border-box;
}

.outlineColumn {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.outlineTitle {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.outlineBadgeGroup {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.outlineBadge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 4px;
}

.outlineBadgeValue {
  font-weight: 600;
  color: #0f172a;
}

.outlineList {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.outlineItem {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.outlineItem:hover {
  background: #f1f5f9;
  color: #0284c7;
}

.outlineItemActive {
  background: #e0f2fe;
  color: #0369a1;
  font-weight: 600;
}

.outlineItemLevel2 {
  padding-left: 8px;
  font-weight: 600;
}

.outlineItemLevel3 {
  padding-left: 20px;
  font-size: 12.5px;
}

.outlineItemLevel4 {
  padding-left: 32px;
  font-size: 12px;
  color: #64748b;
}

.outlineEmpty {
  font-size: 12px;
  font-style: italic;
  color: #94a3b8;
  padding: 8px 0;
}

.canvasColumn {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbarCard {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
}

.toolbarHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.toolbarTitle {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.toolbarButtons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.addBlockBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.addBlockBtn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.addBlockBtn:active:not(:disabled) {
  background: #f1f5f9;
}

.addBlockBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.canvasList {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.emptyCanvas {
  text-align: center;
  padding: 40px 20px;
  background: #ffffff;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
}

.emptyCanvasIcon {
  font-size: 32px;
  margin-bottom: 10px;
  color: #94a3b8;
}

.emptyCanvasText {
  font-size: 14px;
  margin-bottom: 12px;
}

.blockCard {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  overflow: hidden;
}

.blockCard:hover {
  border-color: #cbd5e1;
}

.blockCardActive {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6, 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.blockCardDragging {
  opacity: 0.45;
  background: #f8fafc;
}

.blockCardDropTarget {
  border-top: 3px solid #2563eb;
}

.blockHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  user-select: none;
}

.blockHeaderLeft {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dragHandle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: grab;
  color: #94a3b8;
  transition: all 0.15s ease;
}

.dragHandle:hover {
  background: #e2e8f0;
  color: #475569;
}

.dragHandle:active {
  cursor: grabbing;
}

.blockTypeBadge {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 2px 7px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
}

.blockTypeBadgeHeading { background: #fee2e2; color: #991b1b; }
.blockTypeBadgeText { background: #e0e7ff; color: #3730a3; }
.blockTypeBadgeExample { background: #dcfce7; color: #166534; }
.blockTypeBadgeDialogue { background: #fef3c7; color: #92400e; }
.blockTypeBadgeCallout { background: #ede9fe; color: #5b21b6; }
.blockTypeBadgeMedia { background: #ccfbf1; color: #115e59; }
.blockTypeBadgeGrammar { background: #fae8ff; color: #86198f; }
.blockTypeBadgeDivider { background: #f1f5f9; color: #64748b; }
.blockTypeBadgeVocabulary { background: #fef9c3; color: #854d0e; }

.blockPositionBadge {
  font-size: 11px;
  color: #64748b;
  font-weight: 600;
}

.blockActions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.blockActionButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.blockActionButton:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}

.blockActionButton:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.blockActionDelete:hover:not(:disabled) {
  background: #fee2e2;
  color: #b91c1c;
}

.blockBody {
  padding: 16px;
}

.formGroup {
  margin-bottom: 12px;
}

.formGroup:last-child {
  margin-bottom: 0;
}

.formLabel {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 4px;
}

.formInput {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #0f172a;
  box-sizing: border-box;
}

.formInput:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.formSelect {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  background: #ffffff;
  color: #0f172a;
  box-sizing: border-box;
}

.formTextarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #0f172a;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}

.charCount {
  text-align: right;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.previewColumn {
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.previewHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.previewHeaderTitle {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.previewLiveIndicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.previewDeviceToggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #e2e8f0;
  padding: 2px;
  border-radius: 6px;
}

.previewDeviceBtn {
  border: none;
  background: transparent;
  padding: 4px 8px;
  font-size: 11.5px;
  font-weight: 500;
  border-radius: 4px;
  color: #64748b;
  cursor: pointer;
}

.previewDeviceBtnActive {
  background: #ffffff;
  color: #0f172a;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.previewViewportWrapper {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.previewViewportMobile {
  max-width: 380px;
  margin: 0 auto;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 14px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

@media (min-width: 993px) {
  .studio-col-outline,
  .studio-col-canvas,
  .studio-col-preview {
    display: block !important;
  }
}

@media (max-width: 1200px) {
  .studioColumns {
    grid-template-columns: 200px 1fr 340px;
    gap: 14px;
  }
}

@media (max-width: 992px) {
  .studioColumns {
    display: flex;
    flex-direction: column;
  }

  .studio-col-outline,
  .studio-col-canvas,
  .studio-col-preview {
    display: none;
  }

  .studioLayout[data-mobile-tab="outline"] .studio-col-outline {
    display: block !important;
  }
  .studioLayout[data-mobile-tab="canvas"] .studio-col-canvas {
    display: block !important;
  }
  .studioLayout[data-mobile-tab="preview"] .studio-col-preview {
    display: block !important;
  }

  .studioViewTabs {
    display: flex;
  }

  .outlineColumn,
  .canvasColumn,
  .previewColumn {
    position: static;
    max-height: none;
    width: 100%;
  }

  .viewTabBtn {
    border: none;
    background: transparent;
    padding: 6px 12px;
    font-size: 13px;
    border-radius: 4px;
    cursor: pointer;
    color: #64748b;
  }

  .viewTabBtnActive {
    background: #ffffff;
    color: #0f172a;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
}
`;

export const styles: Record<string, string> = {
  studioLayout: 'studioLayout',
  studioHeaderBar: 'studioHeaderBar',
  studioHeaderLeft: 'studioHeaderLeft',
  studioFormatBadge: 'studioFormatBadge',
  studioViewTabs: 'studioViewTabs',
  studioColumns: 'studioColumns',
  outlineColumn: 'outlineColumn',
  outlineTitle: 'outlineTitle',
  outlineBadgeGroup: 'outlineBadgeGroup',
  outlineBadge: 'outlineBadge',
  outlineBadgeValue: 'outlineBadgeValue',
  outlineList: 'outlineList',
  outlineItem: 'outlineItem',
  outlineItemActive: 'outlineItemActive',
  outlineItemLevel2: 'outlineItemLevel2',
  outlineItemLevel3: 'outlineItemLevel3',
  outlineItemLevel4: 'outlineItemLevel4',
  outlineEmpty: 'outlineEmpty',
  canvasColumn: 'canvasColumn',
  toolbarCard: 'toolbarCard',
  toolbarHeader: 'toolbarHeader',
  toolbarTitle: 'toolbarTitle',
  toolbarButtons: 'toolbarButtons',
  addBlockBtn: 'addBlockBtn',
  canvasList: 'canvasList',
  emptyCanvas: 'emptyCanvas',
  emptyCanvasIcon: 'emptyCanvasIcon',
  emptyCanvasText: 'emptyCanvasText',
  blockCard: 'blockCard',
  blockCardActive: 'blockCardActive',
  blockCardDragging: 'blockCardDragging',
  blockCardDropTarget: 'blockCardDropTarget',
  blockHeader: 'blockHeader',
  blockHeaderLeft: 'blockHeaderLeft',
  dragHandle: 'dragHandle',
  blockTypeBadge: 'blockTypeBadge',
  blockTypeBadgeHeading: 'blockTypeBadgeHeading',
  blockTypeBadgeText: 'blockTypeBadgeText',
  blockTypeBadgeExample: 'blockTypeBadgeExample',
  blockTypeBadgeDialogue: 'blockTypeBadgeDialogue',
  blockTypeBadgeCallout: 'blockTypeBadgeCallout',
  blockTypeBadgeMedia: 'blockTypeBadgeMedia',
  blockTypeBadgeGrammar: 'blockTypeBadgeGrammar',
  blockTypeBadgeDivider: 'blockTypeBadgeDivider',
  blockTypeBadgeVocabulary: 'blockTypeBadgeVocabulary',
  blockPositionBadge: 'blockPositionBadge',
  blockActions: 'blockActions',
  blockActionButton: 'blockActionButton',
  blockActionDelete: 'blockActionDelete',
  blockBody: 'blockBody',
  formGroup: 'formGroup',
  formLabel: 'formLabel',
  formInput: 'formInput',
  formSelect: 'formSelect',
  formTextarea: 'formTextarea',
  charCount: 'charCount',
  previewColumn: 'previewColumn',
  previewHeader: 'previewHeader',
  previewHeaderTitle: 'previewHeaderTitle',
  previewLiveIndicator: 'previewLiveIndicator',
  previewDeviceToggle: 'previewDeviceToggle',
  previewDeviceBtn: 'previewDeviceBtn',
  previewDeviceBtnActive: 'previewDeviceBtnActive',
  previewViewportWrapper: 'previewViewportWrapper',
  previewViewportMobile: 'previewViewportMobile',
  viewTabBtn: 'viewTabBtn',
  viewTabBtnActive: 'viewTabBtnActive',
};

export default styles;
