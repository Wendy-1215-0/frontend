<script lang="ts" setup>
import ActivityDetailTable from '@components/activity-detail-table.vue';

const { id, editable } = defineProps<{ id: string; editable: boolean }>();
</script>

<template>
    <h2 class="mb-4 text-2xl font-black">活动事项管理</h2>
    <activity-detail-table :id="id" :editable="editable" />
</template>
