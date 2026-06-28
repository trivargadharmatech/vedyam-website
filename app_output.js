import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.jsx");const React = __vite__cjsImport0_react; const useState = __vite__cjsImport0_react["useState"];const _jsxDEV = __vite__cjsImport7_react_jsxDevRuntime["jsxDEV"];import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=69819dd2";
import { BrowserRouter, Routes, Route, Navigate } from "/node_modules/.vite/deps/react-router-dom.js?v=c9bb6e58";
import Login from "/src/components/Login.jsx";
import Dashboard from "/src/components/Dashboard.jsx";
import Layout from "/src/components/Layout.jsx";
import { Analytics, Community, Resources, Settings, Notifications } from "/src/components/PlaceholderPages.jsx";
import ChatbotUI from "/src/components/ChatbotUI.jsx";
var _jsxFileName = "C:/Users/Vedx6/.gemini/antigravity/scratch/vedyam-learning-mode/simulator-frontend/src/App.jsx";
import __vite__cjsImport7_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=69819dd2";
var _s = $RefreshSig$();
function App() {
	_s();
	const [user, setUser] = useState(null);
	return /* @__PURE__ */ _jsxDEV(BrowserRouter, { children: /* @__PURE__ */ _jsxDEV(Routes, { children: [/* @__PURE__ */ _jsxDEV(Route, {
		path: "/chatbot",
		element: /* @__PURE__ */ _jsxDEV(ChatbotUI, {}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 15,
			columnNumber: 41
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 15,
		columnNumber: 9
	}, this), /* @__PURE__ */ _jsxDEV(Route, {
		path: "/*",
		element: !user ? /* @__PURE__ */ _jsxDEV(Login, { onLogin: (userData) => setUser(userData) }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 18,
			columnNumber: 13
		}, this) : /* @__PURE__ */ _jsxDEV(Layout, {
			user,
			onLogout: () => setUser(null),
			children: /* @__PURE__ */ _jsxDEV(Routes, { children: [
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/",
					element: /* @__PURE__ */ _jsxDEV(Dashboard, { user }, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 22,
						columnNumber: 42
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 22,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/analytics",
					element: /* @__PURE__ */ _jsxDEV(Analytics, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 23,
						columnNumber: 51
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 23,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/community",
					element: /* @__PURE__ */ _jsxDEV(Community, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 24,
						columnNumber: 51
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 24,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/resources",
					element: /* @__PURE__ */ _jsxDEV(Resources, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 25,
						columnNumber: 51
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 25,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/settings",
					element: /* @__PURE__ */ _jsxDEV(Settings, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 26,
						columnNumber: 50
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 26,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "/notifications",
					element: /* @__PURE__ */ _jsxDEV(Notifications, {}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 27,
						columnNumber: 55
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 27,
					columnNumber: 17
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "*",
					element: /* @__PURE__ */ _jsxDEV(Navigate, {
						to: "/",
						replace: true
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 28,
						columnNumber: 42
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 28,
					columnNumber: 17
				}, this)
			] }, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 21,
				columnNumber: 15
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 20,
			columnNumber: 13
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 16,
		columnNumber: 9
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 14,
		columnNumber: 7
	}, this) }, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 13,
		columnNumber: 5
	}, this);
}
_s(App, "Iei9RGtZU29Y1RhBe1sbfh/MntA=");
_c = App;
export default App;
var _c;
$RefreshReg$(_c, "App");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/App.jsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/Vedx6/.gemini/antigravity/scratch/vedyam-learning-mode/simulator-frontend/src/App.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/Vedx6/.gemini/antigravity/scratch/vedyam-learning-mode/simulator-frontend/src/App.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "C:/Users/Vedx6/.gemini/antigravity/scratch/vedyam-learning-mode/simulator-frontend/src/App.jsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBQUEsT0FBTyxTQUFTLGdCQUFnQjtBQUNoQyxTQUFTLGVBQWUsUUFBUSxPQUFPLGdCQUFnQjtBQUN2RCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sWUFBWTtBQUNuQixTQUFTLFdBQVcsV0FBVyxXQUFXLFVBQVUscUJBQXFCO0FBQ3pFLE9BQU8sZUFBZTs7OztBQUV0QixTQUFTLE1BQU07O0NBQ2IsTUFBTSxDQUFDLE1BQU0sV0FBVyxTQUFTLElBQUk7Q0FFckMsT0FDRSx3QkFBQyxlQUFELFlBQ0Usd0JBQUMsUUFBRCxhQUNFLHdCQUFDLE9BQUQ7RUFBTyxNQUFLO0VBQVcsU0FBUyx3QkFBQyxXQUFELENBQVk7Ozs7O0NBQUk7Ozs7V0FDaEQsd0JBQUMsT0FBRDtFQUFPLE1BQUs7RUFBSyxTQUNmLENBQUMsT0FDQyx3QkFBQyxPQUFELEVBQU8sVUFBVSxhQUFhLFFBQVEsUUFBUSxFQUFJOzs7O2FBRWxELHdCQUFDLFFBQUQ7R0FBYztHQUFNLGdCQUFnQixRQUFRLElBQUk7YUFDOUMsd0JBQUMsUUFBRDtJQUNFLHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQUksU0FBUyx3QkFBQyxXQUFELEVBQWlCLEtBQU87Ozs7O0lBQUk7Ozs7O0lBQ3JELHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQWEsU0FBUyx3QkFBQyxXQUFELENBQVk7Ozs7O0lBQUk7Ozs7O0lBQ2xELHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQWEsU0FBUyx3QkFBQyxXQUFELENBQVk7Ozs7O0lBQUk7Ozs7O0lBQ2xELHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQWEsU0FBUyx3QkFBQyxXQUFELENBQVk7Ozs7O0lBQUk7Ozs7O0lBQ2xELHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQVksU0FBUyx3QkFBQyxVQUFELENBQVc7Ozs7O0lBQUk7Ozs7O0lBQ2hELHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQWlCLFNBQVMsd0JBQUMsZUFBRCxDQUFnQjs7Ozs7SUFBSTs7Ozs7SUFDMUQsd0JBQUMsT0FBRDtLQUFPLE1BQUs7S0FBSSxTQUFTLHdCQUFDLFVBQUQ7TUFBVSxJQUFHO01BQUk7S0FBUzs7Ozs7SUFBSTs7Ozs7R0FDakQ7Ozs7O0VBQ0Y7Ozs7O0NBRVQ7Ozs7U0FDRzs7OztVQUNLOzs7OztBQUVuQjs7O0FBRUEsZUFBZSIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJBcHAuanN4Il0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJyb3dzZXJSb3V0ZXIsIFJvdXRlcywgUm91dGUsIE5hdmlnYXRlIH0gZnJvbSAncmVhY3Qtcm91dGVyLWRvbSc7XG5pbXBvcnQgTG9naW4gZnJvbSAnLi9jb21wb25lbnRzL0xvZ2luJztcbmltcG9ydCBEYXNoYm9hcmQgZnJvbSAnLi9jb21wb25lbnRzL0Rhc2hib2FyZCc7XG5pbXBvcnQgTGF5b3V0IGZyb20gJy4vY29tcG9uZW50cy9MYXlvdXQnO1xuaW1wb3J0IHsgQW5hbHl0aWNzLCBDb21tdW5pdHksIFJlc291cmNlcywgU2V0dGluZ3MsIE5vdGlmaWNhdGlvbnMgfSBmcm9tICcuL2NvbXBvbmVudHMvUGxhY2Vob2xkZXJQYWdlcyc7XG5pbXBvcnQgQ2hhdGJvdFVJIGZyb20gJy4vY29tcG9uZW50cy9DaGF0Ym90VUknO1xuXG5mdW5jdGlvbiBBcHAoKSB7XG4gIGNvbnN0IFt1c2VyLCBzZXRVc2VyXSA9IHVzZVN0YXRlKG51bGwpO1xuXG4gIHJldHVybiAoXG4gICAgPEJyb3dzZXJSb3V0ZXI+XG4gICAgICA8Um91dGVzPlxuICAgICAgICA8Um91dGUgcGF0aD1cIi9jaGF0Ym90XCIgZWxlbWVudD17PENoYXRib3RVSSAvPn0gLz5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIvKlwiIGVsZW1lbnQ9e1xuICAgICAgICAgICF1c2VyID8gKFxuICAgICAgICAgICAgPExvZ2luIG9uTG9naW49eyh1c2VyRGF0YSkgPT4gc2V0VXNlcih1c2VyRGF0YSl9IC8+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIDxMYXlvdXQgdXNlcj17dXNlcn0gb25Mb2dvdXQ9eygpID0+IHNldFVzZXIobnVsbCl9PlxuICAgICAgICAgICAgICA8Um91dGVzPlxuICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL1wiIGVsZW1lbnQ9ezxEYXNoYm9hcmQgdXNlcj17dXNlcn0gLz59IC8+XG4gICAgICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvYW5hbHl0aWNzXCIgZWxlbWVudD17PEFuYWx5dGljcyAvPn0gLz5cbiAgICAgICAgICAgICAgICA8Um91dGUgcGF0aD1cIi9jb21tdW5pdHlcIiBlbGVtZW50PXs8Q29tbXVuaXR5IC8+fSAvPlxuICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiL3Jlc291cmNlc1wiIGVsZW1lbnQ9ezxSZXNvdXJjZXMgLz59IC8+XG4gICAgICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvc2V0dGluZ3NcIiBlbGVtZW50PXs8U2V0dGluZ3MgLz59IC8+XG4gICAgICAgICAgICAgICAgPFJvdXRlIHBhdGg9XCIvbm90aWZpY2F0aW9uc1wiIGVsZW1lbnQ9ezxOb3RpZmljYXRpb25zIC8+fSAvPlxuICAgICAgICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiKlwiIGVsZW1lbnQ9ezxOYXZpZ2F0ZSB0bz1cIi9cIiByZXBsYWNlIC8+fSAvPlxuICAgICAgICAgICAgICA8L1JvdXRlcz5cbiAgICAgICAgICAgIDwvTGF5b3V0PlxuICAgICAgICAgIClcbiAgICAgICAgfSAvPlxuICAgICAgPC9Sb3V0ZXM+XG4gICAgPC9Ccm93c2VyUm91dGVyPlxuICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBBcHA7XG4iXX0=