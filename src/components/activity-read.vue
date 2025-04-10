<script lang="ts" setup>
import { inject, ref } from 'vue';
import Spinner from '@components/spinner.vue';
import { GoodDate } from '@utils/datetime';
import { Activity } from '@models/activity';
import ActivityPreview from '@components/activity-preview.vue';

const { setMessage } = inject('banner') as any;

interface Model {
    id: string;
    name: string;
    date: string;
    description: string;
    location: string;
}

const {
        id,
    } = defineProps<{
        id: string;
        onSaved: (activity: Model) => void;
        editable?: boolean;
    }>(),
    isCreatingNewActivity = id.startsWith('new_'),
    activity = ref<Model>({
        id: id.substring(4),
        name: '',
        date: new GoodDate().toInputDateString(),
        description: '',
        location: '',
    }),
    status = ref(isCreatingNewActivity ? 1 : 0);

const getActivity = async () => {
        status.value = 0;
        try {
            const data = await Activity.get(id, {
                serverEndpoint: 'http://127.0.0.1/api',
            });
            activity.value = {
                id: id,
                name: data.name,
                date: data.date.toInputDateString(),
                description: data.description,
                location: data.location,
            };
            setMessage({
                type: 'success',
                message: '获取活动信息成功',
            });
            status.value = 1;
        } catch (e) {
            console.error(e);
            setMessage({
                type: 'error',
                message: '获取活动信息失败，请稍后重试',
            });
            status.value = 2;
        }
    };

if (!isCreatingNewActivity) {
    getActivity();
}
</script>

<template>
    <Spinner v-if="status === 0" />
    <div v-if="status !== 2" class="lg:flex lg:w-full lg:items-start lg:space-x-8">
        <div class="w-md rounded-lg p-4">
            <activity-preview :model="activity" />
        </div>
    </div>
    <p v-if="status === 2">
        无法获取活动信息；
        <a class="text-primary dark:text-primary-200 underline" href="?" @click.prevent="getActivity">重试</a>
    </p>
</template>
