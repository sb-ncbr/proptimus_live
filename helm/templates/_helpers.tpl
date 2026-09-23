{{/* Chart name. */}}
{{- define "proptimus.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Fully qualified release name. */}}
{{- define "proptimus.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/* Chart label. */}}
{{- define "proptimus.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Common labels. Expects dict with root and component. */}}
{{- define "proptimus.labels" -}}
helm.sh/chart: {{ include "proptimus.chart" .root }}
{{ include "proptimus.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
app.kubernetes.io/version: {{ .root.Chart.AppVersion | quote }}
{{- end }}

{{/* Immutable selector labels. Expects dict with root and component. */}}
{{- define "proptimus.selectorLabels" -}}
app.kubernetes.io/name: {{ include "proptimus.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/* Component ServiceAccount name. Expects dict with root and component. */}}
{{- define "proptimus.serviceAccountName" -}}
{{- $account := index .root.Values.serviceAccounts .component }}
{{- if $account.create }}
{{- default (printf "%s-%s" (include "proptimus.fullname" .root) .component) $account.name }}
{{- else }}
{{- default "default" $account.name }}
{{- end }}
{{- end }}

{{/* API PVC name. */}}
{{- define "proptimus.apiPvcName" -}}
{{- printf "%s-calculated-structures" (include "proptimus.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/* Prefix used by the API when Kubernetes generates a worker Job name. */}}
{{- define "proptimus.workerJobGenerateName" -}}
{{- printf "%s-worker" (include "proptimus.fullname" .) | trunc 52 | trimSuffix "-" }}-
{{- end }}

{{/* Resolve a component image. Expects dict with root and image. */}}
{{- define "proptimus.image" -}}
{{- printf "%s:%s" .image.repository (default .root.Chart.AppVersion .image.tag) }}
{{- end }}

