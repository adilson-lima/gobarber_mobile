import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigation, useRoute, } from '@react-navigation/native'
import { Platform, Alert } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import DateTimePicker from '@react-native-community/datetimepicker'
import { format } from 'date-fns'




// import { View, Button } from 'react-native'


import api from '../../services/api'
import { useAuth } from '../../hooks/auth'
import {
    Container,
    Header,
    BackButton,
    HeaderTitle,
    UserAvatar,
    Content,
    ProvidersListContainer,
    ProvidersList,
    ProviderContainer,
    ProviderAvatar,
    ProviderText,
    Calendar,
    Title,
    OpenDatePickerButton,
    OpenDatePickerText,
    Schedule,
    Section,
    SectionTitle,
    SectionContent,
    Hour,
    HourText,
    CreateAppointmentButton,
    CreateAppointmentButtonText,

} from './styles'

// import { set } from 'react-native-reanimated'


interface RouteParams {
    providerId: string;
}

export interface Provider {
    id: string;
    name: string;
    avatar_url: string;
}

interface AvailabilityItem {
    hour: number;
    available: boolean;
}

const CreateAppointment: React.FC = () => {

    const route = useRoute()
    const routeParams = route.params as RouteParams;

    const [availability, setAvailability] = useState<AvailabilityItem[]>([])
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedHour, setSelectedHour] = useState(0)

    const [providers, setProviders] = useState<Provider[]>([])
    const [selectedProvider, setSelectedProvider] = useState(routeParams.providerId);

    const { signOut, user } = useAuth();

    useEffect(() => {
        api.get('providers').then(response => {
            setProviders(response.data);
        })
    }, [])

    useEffect(() => {
        api.get(`providers/${selectedProvider}/day-availability`, {
            params: {
                year: selectedDate.getFullYear(),
                month: selectedDate.getMonth() + 1,
                day: selectedDate.getDate(),
            }
        }).then(response => {
            setAvailability(response.data)
        })
    }, [selectedDate, selectedProvider])

    const { goBack, navigate } = useNavigation()

    const navigateBack = useCallback(() => {
        goBack()
    }, [goBack])

    const handleSelectProvider = useCallback((providerId) => {
        setSelectedProvider(providerId);
    }, [])

    const handleToggleDatePicker = useCallback(() => {
        setShowDatePicker(state => !state)
    }, [])

    const handleDateChanged = useCallback((event: any, date: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (date) {
            setSelectedDate(date)
        }

    }, [])


    const morningAvailability = useMemo(() => {
        return availability
            .filter(({ hour }) => hour < 12)
            .map(({ hour, available }) => {
                return {
                    hour,
                    available,
                    hourFormated: format(new Date().setHours(hour), 'HH:00')
                }
            })
    }, [availability])


    const afternoonAvailability = useMemo(() => {
        return availability
            .filter(({ hour }) => hour >= 12)
            .map(({ hour, available }) => {
                return {
                    hour,
                    available,
                    hourFormated: format(new Date().setHours(hour), 'HH:00')
                }
            })
    }, [availability])

    const handleSelectHour = useCallback((hour: number) => {
        setSelectedHour(hour)
    }, [])


    const handleCreateAppointment = useCallback(async()=>{
        try {
            const date = new Date(selectedDate);
            date.setHours(selectedHour);
            date.setMinutes(0);

            await api.post('appointments', {
                provider_id: selectedProvider,
                date,
            })

            navigate('AppointmentCreated', {date: date.getTime()})
        }
        catch(err){
            Alert.alert(
                'Erro ao criar agendamento',
                'Ocorreu um erro ao tentar criar o agendamento, tente novamente.'
            )
        }

    }, [navigate, selectedDate, selectedHour, selectedProvider])

    return (
        <Container >
            <Header>
                <BackButton onPress={navigateBack}>
                    <Icon name="chevron-left" size={24} color="#999591" />
                </BackButton>
                <HeaderTitle>Cabeleireiros</HeaderTitle>
                <UserAvatar source={{ uri: user.avatar_url }} />
            </Header>

            <Content>
                <ProvidersListContainer>
                    <ProvidersList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={providers}
                        keyExtractor={provider => provider.id}
                        renderItem={({ item: provider }) => (
                            <ProviderContainer
                                selected={provider.id === selectedProvider}
                                onPress={() => handleSelectProvider(provider.id)}
                            >
                                <ProviderAvatar source={{ uri: provider.avatar_url }} />
                                <ProviderText
                                    selected={provider.id === selectedProvider}
                                >
                                    {provider.name}
                                </ProviderText>

                            </ProviderContainer>
                        )}
                    >
                    </ProvidersList>
                </ProvidersListContainer>

                <Calendar>
                    <Title>Escolha a data</Title>

                    <OpenDatePickerButton onPress={handleToggleDatePicker} >
                        <OpenDatePickerText>Selecionar outra data</OpenDatePickerText>
                    </OpenDatePickerButton>

                    {showDatePicker && <DateTimePicker
                        {...(Platform.OS === 'ios' && { textColor: '#f4ede8' })} // < nessa linha
                        mode="date"
                        display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                        onChange={handleDateChanged}
                        value={selectedDate}
                    />
                    }
                </Calendar>

                <Schedule>
                    <Title>Escolha o horário</Title>

                    <Section>
                        <SectionTitle>Manhã</SectionTitle>
                        <SectionContent horizontal>
                            {morningAvailability.map(({ hourFormated, hour, available }) => (
                                <Hour
                                    enabled={available}
                                    selected={selectedHour === hour}
                                    available={available}
                                    key={hourFormated}
                                    onPress={() => handleSelectHour(hour)}
                                >
                                    <HourText
                                        selected={selectedHour === hour}
                                    >
                                        {hourFormated}
                                    </HourText>
                                </Hour>
                            ))}
                        </SectionContent>
                    </Section>

                    <Section>
                        <SectionTitle>Tarde</SectionTitle>
                        <SectionContent>
                            {afternoonAvailability.map(({ hourFormated, hour, available }) => (
                                <Hour
                                    enabled={available}
                                    selected={selectedHour === hour}
                                    available={available}
                                    key={hourFormated}
                                    onPress={() => handleSelectHour(hour)}
                                >
                                    <HourText
                                        selected={selectedHour === hour}
                                    >
                                        {hourFormated}
                                    </HourText>
                                </Hour>
                            ))}
                        </SectionContent>
                    </Section>
                </Schedule>

                <CreateAppointmentButton onPress={handleCreateAppointment}>
                    <CreateAppointmentButtonText>Agendar</CreateAppointmentButtonText>
                </CreateAppointmentButton>

            </Content>
        </Container>


    )
}

export default CreateAppointment
