# Proguard rules for Lingora Android
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.pnttung.lingora.data.remote.dto.** { *; }
